/* eslint-disable max-lines */
import type {
  Breadcrumb,
  BreadcrumbHint,
  Client,
  ClientOptions,
  DataCategory,
  DsnComponents,
  DynamicSamplingContext,
  Envelope,
  ErrorEvent,
  Event,
  EventDropReason,
  EventHint,
  EventProcessor,
  FeedbackEvent,
  Integration,
  IntegrationClass,
  MetricBucketItem,
  MetricsAggregator,
  Outcome,
  ParameterizedString,
  PropagationContext,
  SdkMetadata,
  Session,
  SessionAggregates,
  Severity,
  SeverityLevel,
  Transaction,
  TransactionEvent,
  Transport,
  TransportMakeRequestResponse,
} from '@sentry/types';
import {
  SentryError,
  SyncPromise,
  addItemToEnvelope,
  checkOrSetAlreadyCaught,
  createAttachmentEnvelopeItem,
  isParameterizedString,
  isPlainObject,
  isPrimitive,
  isThenable,
  logger,
  makeDsn,
  rejectedSyncPromise,
  resolvedSyncPromise,
} from '@sentry/utils';

import { getEnvelopeEndpointWithUrlEncodedAuth } from './api';
import { DEBUG_BUILD } from './debug-build';
import { createEventEnvelope, createSessionEnvelope } from './envelope';
import { getClient } from './exports';
import { getIsolationScope } from './hub';
import type { IntegrationIndex } from './integration';
import { setupIntegration, setupIntegrations } from './integration';
import { createMetricEnvelope } from './metrics/envelope';
import type { Scope } from './scope';
import { updateSession } from './session';
import { getDynamicSamplingContextFromClient } from './tracing/dynamicSamplingContext';
import { prepareEvent } from './utils/prepareEvent';

const ALREADY_SEEN_ERROR = "Not capturing exception because it's already been captured.";

/**
 * Base implementation for all JavaScript SDK clients.
 *
 * Call the constructor with the corresponding options
 * specific to the client subclass. To access these options later, use
 * {@link Client.getOptions}.
 *
 * If a Dsn is specified in the options, it will be parsed and stored. Use
 * {@link Client.getDsn} to retrieve the Dsn at any moment. In case the Dsn is
 * invalid, the constructor will throw a {@link SentryException}. Note that
 * without a valid Dsn, the SDK will not send any events to Sentry.
 *
 * Before sending an event, it is passed through
 * {@link BaseClient._prepareEvent} to add SDK information and scope data
 * (breadcrumbs and context). To add more custom information, override this
 * method and extend the resulting prepared event.
 *
 * To issue automatically created events (e.g. via instrumentation), use
 * {@link Client.captureEvent}. It will prepare the event and pass it through
 * the callback lifecycle. To issue auto-breadcrumbs, use
 * {@link Client.addBreadcrumb}.
 *
 * @example
 * class NodeClient extends BaseClient<NodeOptions> {
 *   public constructor(options: NodeOptions) {
 *     super(options);
 *   }
 *
 *   // ...
 * }
 */
export abstract class BaseClient<O extends ClientOptions> implements Client<O> {
  /**
   * A reference to a metrics aggregator
   *
   * @experimental Note this is alpha API. It may experience breaking changes in the future.
   */
  public metricsAggregator?: MetricsAggregator;

  /** Options passed to the SDK. */
  protected readonly _options: O;

  /** The client Dsn, if specified in options. Without this Dsn, the SDK will be disabled. */
  protected readonly _dsn?: DsnComponents;

  protected readonly _transport?: Transport;

  /** Array of set up integrations. */
  protected _integrations: IntegrationIndex;

  /** Indicates whether this client's integrations have been set up. */
  protected _integrationsInitialized: boolean;

  /** Number of calls being processed */
  protected _numProcessing: number;

  protected _eventProcessors: EventProcessor[];

  /** Holds flushable  */
  private _outcomes: { [key: string]: number };

  // eslint-disable-next-line @typescript-eslint/ban-types
  private _hooks: Record<string, Function[]>;

  /**
   * Initializes this client instance.
   *
   * @param options Options for the client.
   */
  protected constructor(options: O) {
    this._options = options;
    this._integrations = {};
    this._integrationsInitialized = false;
    this._numProcessing = 0;
    this._outcomes = {};
    this._hooks = {};
    this._eventProcessors = [];

    if (options.dsn) {
      this._dsn = makeDsn(options.dsn);
    } else {
      DEBUG_BUILD && logger.warn('No DSN provided, client will not send events.');
    }

    if (this._dsn) {
      const url = getEnvelopeEndpointWithUrlEncodedAuth(this._dsn, options);
      this._transport = options.transport({
        recordDroppedEvent: this.recordDroppedEvent.bind(this),
        ...options.transportOptions,
        url,
      });
    }
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public captureException(exception: any, hint?: EventHint, scope?: Scope): string | undefined {
    // ensure we haven't captured this very object before
    if (checkOrSetAlreadyCaught(exception)) {
      DEBUG_BUILD && logger.log(ALREADY_SEEN_ERROR);
      return;
    }

    let eventId: string | undefined = hint && hint.event_id;

    this._process(
      this.eventFromException(exception, hint)
        .then(event => this._captureEvent(event, hint, scope))
        .then(result => {
          eventId = result;
        }),
    );

    return eventId;
  }

  /**
   * @inheritDoc
   */
  public captureMessage(
    message: ParameterizedString,
    // eslint-disable-next-line deprecation/deprecation
    level?: Severity | SeverityLevel,
    hint?: EventHint,
    scope?: Scope,
  ): string | undefined {
    let eventId: string | undefined = hint && hint.event_id;

    const eventMessage = isParameterizedString(message) ? message : String(message);

    const promisedEvent = isPrimitive(message)
      ? this.eventFromMessage(eventMessage, level, hint)
      : this.eventFromException(message, hint);

    this._process(
      promisedEvent
        .then(event => this._captureEvent(event, hint, scope))
        .then(result => {
          eventId = result;
        }),
    );

    return eventId;
  }

  /**
   * @inheritDoc
   */
  public captureEvent(event: Event, hint?: EventHint, scope?: Scope): string | undefined {
    // ensure we haven't captured this very object before
    if (hint && hint.originalException && checkOrSetAlreadyCaught(hint.originalException)) {
      DEBUG_BUILD && logger.log(ALREADY_SEEN_ERROR);
      return;
    }

    let eventId: string | undefined = hint && hint.event_id;

    this._process(
      this._captureEvent(event, hint, scope).then(result => {
        eventId = result;
      }),
    );

    return eventId;
  }

  /**
   * @inheritDoc
   */
  public captureSession(session: Session): void {
    if (!(typeof session.release === 'string')) {
      DEBUG_BUILD && logger.warn('Discarded session because of missing or non-string release');
    } else {
      this.sendSession(session);
      // After sending, we set init false to indicate it's not the first occurrence
      updateSession(session, { init: false });
    }
  }

  /**
   * @inheritDoc
   */
  public getDsn(): DsnComponents | undefined {
    return this._dsn;
  }

  /**
   * @inheritDoc
   */
  public getOptions(): O {
    return this._options;
  }

  /**
   * @see SdkMetadata in @sentry/types
   *
   * @return The metadata of the SDK
   */
  public getSdkMetadata(): SdkMetadata | undefined {
    return this._options._metadata;
  }

  /**
   * @inheritDoc
   */
  public getTransport(): Transport | undefined {
    return this._transport;
  }

  /**
   * @inheritDoc
   */
  public flush(timeout?: number): PromiseLike<boolean> {
    const transport = this._transport;
    if (transport) {
      if (this.metricsAggregator) {
        this.metricsAggregator.flush();
      }
      return this._isClientDoneProcessing(timeout).then(clientFinished => {
        return transport.flush(timeout).then(transportFlushed => clientFinished && transportFlushed);
      });
    } else {
      return resolvedSyncPromise(true);
    }
  }

  /**
   * @inheritDoc
   */
  public close(timeout?: number): PromiseLike<boolean> {
    return this.flush(timeout).then(result => {
      this.getOptions().enabled = false;
      if (this.metricsAggregator) {
        this.metricsAggregator.close();
      }
      return result;
    });
  }

  /** Get all installed event processors. */
  public getEventProcessors(): EventProcessor[] {
    return this._eventProcessors;
  }

  /** @inheritDoc */
  public addEventProcessor(eventProcessor: EventProcessor): void {
    this._eventProcessors.push(eventProcessor);
  }

  /**
   * This is an internal function to setup all integrations that should run on the client.
   * @deprecated Use `client.init()` instead.
   */
  public setupIntegrations(forceInitialize?: boolean): void {
    if ((forceInitialize && !this._integrationsInitialized) || (this._isEnabled() && !this._integrationsInitialized)) {
      this._setupIntegrations();
    }
  }

  /** @inheritdoc */
  public init(): void {
    if (this._isEnabled()) {
      this._setupIntegrations();
    }
  }

  /**
   * Gets an installed integration by its `id`.
   *
   * @returns The installed integration or `undefined` if no integration with that `id` was installed.
   * @deprecated Use `getIntegrationByName()` instead.
   */
  public getIntegrationById(integrationId: string): Integration | undefined {
    return this.getIntegrationByName(integrationId);
  }

  /**
   * Gets an installed integration by its name.
   *
   * @returns The installed integration or `undefined` if no integration with that `name` was installed.
   */
  public getIntegrationByName<T extends Integration = Integration>(integrationName: string): T | undefined {
    return this._integrations[integrationName] as T | undefined;
  }

  /**
   * Returns the client's instance of the given integration class, it any.
   * @deprecated Use `getIntegrationByName()` instead.
   */
  public getIntegration<T extends Integration>(integration: IntegrationClass<T>): T | null {
    try {
      return (this._integrations[integration.id] as T) || null;
    } catch (_oO) {
      DEBUG_BUILD && logger.warn(`Cannot retrieve integration ${integration.id} from the current Client`);
      return null;
    }
  }

  /**
   * @inheritDoc
   */
  public addIntegration(integration: Integration): void {
    setupIntegration(this, integration, this._integrations);
  }

  /**
   * @inheritDoc
   */
  public sendEvent(event: Event, hint: EventHint = {}): void {
    this.emit('beforeSendEvent', event, hint);

    let env = createEventEnvelope(event, this._dsn, this._options._metadata, this._options.tunnel);

    for (const attachment of hint.attachments || []) {
      env = addItemToEnvelope(
        env,
        createAttachmentEnvelopeItem(
          attachment,
          this._options.transportOptions && this._options.transportOptions.textEncoder,
        ),
      );
    }

    const promise = this._sendEnvelope(env);
    if (promise) {
      promise.then(sendResponse => this.emit('afterSendEvent', event, sendResponse), null);
    }
  }

  /**
   * @inheritDoc
   */
  public sendSession(session: Session | SessionAggregates): void {
    const env = createSessionEnvelope(session, this._dsn, this._options._metadata, this._options.tunnel);

    // _sendEnvelope should not throw
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._sendEnvelope(env);
  }

  /**
   * @inheritDoc
   */
  public recordDroppedEvent(reason: EventDropReason, category: DataCategory, _event?: Event): void {
    // Note: we use `event` in replay, where we overwrite this hook.

    if (this._options.sendClientReports) {
      // We want to track each category (error, transaction, session, replay_event) separately
      // but still keep the distinction between different type of outcomes.
      // We could use nested maps, but it's much easier to read and type this way.
      // A correct type for map-based implementation if we want to go that route
      // would be `Partial<Record<SentryRequestType, Partial<Record<Outcome, number>>>>`
      // With typescript 4.1 we could even use template literal types
      const key = `${reason}:${category}`;
      DEBUG_BUILD && logger.log(`Adding outcome: "${key}"`);

      // The following works because undefined + 1 === NaN and NaN is falsy
      this._outcomes[key] = this._outcomes[key] + 1 || 1;
    }
  }

  /**
   * @inheritDoc
   */
  public captureAggregateMetrics(metricBucketItems: Array<MetricBucketItem>): void {
    DEBUG_BUILD && logger.log(`Flushing aggregated metrics, number of metrics: ${metricBucketItems.length}`);
    const metricsEnvelope = createMetricEnvelope(
      metricBucketItems,
      this._dsn,
      this._options._metadata,
      this._options.tunnel,
    );

    // _sendEnvelope should not throw
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._sendEnvelope(metricsEnvelope);
  }

  // Keep on() & emit() signatures in sync with types' client.ts interface
  /* eslint-disable @typescript-eslint/unified-signatures */

  /** @inheritdoc */
  public on(hook: 'startTransaction', callback: (transaction: Transaction) => void): void;

  /** @inheritdoc */
  public on(hook: 'finishTransaction', callback: (transaction: Transaction) => void): void;

  /** @inheritdoc */
  public on(hook: 'beforeEnvelope', callback: (envelope: Envelope) => void): void;

  /** @inheritdoc */
  public on(hook: 'beforeSendEvent', callback: (event: Event, hint?: EventHint) => void): void;

  /** @inheritdoc */
  public on(hook: 'preprocessEvent', callback: (event: Event, hint?: EventHint) => void): void;

  /** @inheritdoc */
  public on(
    hook: 'afterSendEvent',
    callback: (event: Event, sendResponse: TransportMakeRequestResponse | void) => void,
  ): void;

  /** @inheritdoc */
  public on(hook: 'beforeAddBreadcrumb', callback: (breadcrumb: Breadcrumb, hint?: BreadcrumbHint) => void): void;

  /** @inheritdoc */
  public on(hook: 'createDsc', callback: (dsc: DynamicSamplingContext) => void): void;

  /** @inheritdoc */
  public on(hook: 'otelSpanEnd', callback: (otelSpan: unknown, mutableOptions: { drop: boolean }) => void): void;

  /** @inheritdoc */
  public on(
    hook: 'beforeSendFeedback',
    callback: (feedback: FeedbackEvent, options?: { includeReplay: boolean }) => void,
  ): void;

  /** @inheritdoc */
  public on(hook: string, callback: unknown): void {
    if (!this._hooks[hook]) {
      this._hooks[hook] = [];
    }

    // @ts-expect-error We assue the types are correct
    this._hooks[hook].push(callback);
  }

  /** @inheritdoc */
  public emit(hook: 'startTransaction', transaction: Transaction): void;

  /** @inheritdoc */
  public emit(hook: 'finishTransaction', transaction: Transaction): void;

  /** @inheritdoc */
  public emit(hook: 'beforeEnvelope', envelope: Envelope): void;

  /** @inheritdoc */
  public emit(hook: 'beforeSendEvent', event: Event, hint?: EventHint): void;

  /** @inheritdoc */
  public emit(hook: 'preprocessEvent', event: Event, hint?: EventHint): void;

  /** @inheritdoc */
  public emit(hook: 'afterSendEvent', event: Event, sendResponse: TransportMakeRequestResponse | void): void;

  /** @inheritdoc */
  public emit(hook: 'beforeAddBreadcrumb', breadcrumb: Breadcrumb, hint?: BreadcrumbHint): void;

  /** @inheritdoc */
  public emit(hook: 'createDsc', dsc: DynamicSamplingContext): void;

  /** @inheritdoc */
  public emit(hook: 'otelSpanEnd', otelSpan: unknown, mutableOptions: { drop: boolean }): void;

  /** @inheritdoc */
  public emit(hook: 'beforeSendFeedback', feedback: FeedbackEvent, options?: { includeReplay: boolean }): void;

  /** @inheritdoc */
  public emit(hook: string, ...rest: unknown[]): void {
    if (this._hooks[hook]) {
      this._hooks[hook].forEach(callback => callback(...rest));
    }
  }

  /* eslint-enable @typescript-eslint/unified-signatures */

  /** Setup integrations for this client. */
  protected _setupIntegrations(): void {
    this._integrations = setupIntegrations(this, this._options.integrations);
    // TODO v8: We don't need this flag anymore
    this._integrationsInitialized = true;
  }

  /** Updates existing session based on the provided event */
  protected _updateSessionFromEvent(session: Session, event: Event): void {
    let crashed = false;
    let errored = false;
    const exceptions = event.exception && event.exception.values;

    if (exceptions) {
      errored = true;

      for (const ex of exceptions) {
        const mechanism = ex.mechanism;
        if (mechanism && mechanism.handled === false) {
          crashed = true;
          break;
        }
      }
    }

    // A session is updated and that session update is sent in only one of the two following scenarios:
    // 1. Session with non terminal status and 0 errors + an error occurred -> Will set error count to 1 and send update
    // 2. Session with non terminal status and 1 error + a crash occurred -> Will set status crashed and send update
    const sessionNonTerminal = session.status === 'ok';
    const shouldUpdateAndSend = (sessionNonTerminal && session.errors === 0) || (sessionNonTerminal && crashed);

    if (shouldUpdateAndSend) {
      updateSession(session, {
        ...(crashed && { status: 'crashed' }),
        errors: session.errors || Number(errored || crashed),
      });
      this.captureSession(session);
    }
  }

  /**
   * Determine if the client is finished processing. Returns a promise because it will wait `timeout` ms before saying
   * "no" (resolving to `false`) in order to give the client a chance to potentially finish first.
   *
   * @param timeout The time, in ms, after which to resolve to `false` if the client is still busy. Passing `0` (or not
   * passing anything) will make the promise wait as long as it takes for processing to finish before resolving to
   * `true`.
   * @returns A promise which will resolve to `true` if processing is already done or finishes before the timeout, and
   * `false` otherwise
   */
  protected _isClientDoneProcessing(timeout?: number): PromiseLike<boolean> {
    return new SyncPromise(resolve => {
      let ticked: number = 0;
      const tick: number = 1;

      const interval = setInterval(() => {
        if (this._numProcessing == 0) {
          clearInterval(interval);
          resolve(true);
        } else {
          ticked += tick;
          if (timeout && ticked >= timeout) {
            clearInterval(interval);
            resolve(false);
          }
        }
      }, tick);
    });
  }

  /** Determines whether this SDK is enabled and a transport is present. */
  protected _isEnabled(): boolean {
    return this.getOptions().enabled !== false && this._transport !== undefined;
  }

  /**
   * Adds common information to events.
   *
   * The information includes release and environment from `options`,
   * breadcrumbs and context (extra, tags and user) from the scope.
   *
   * Information that is already present in the event is never overwritten. For
   * nested objects, such as the context, keys are merged.
   *
   * @param event The original event.
   * @param hint May contain additional information about the original exception.
   * @param scope A scope containing event metadata.
   * @returns A new event with more information.
   */
  protected _prepareEvent(
    event: Event,
    hint: EventHint,
    scope?: Scope,
    isolationScope = getIsolationScope(),
  ): PromiseLike<Event | null> {
    const options = this.getOptions();
    const integrations = Object.keys(this._integrations);
    if (!hint.integrations && integrations.length > 0) {
      hint.integrations = integrations;
    }

    this.emit('preprocessEvent', event, hint);

    return prepareEvent(options, event, hint, scope, this, isolationScope).then(evt => {
      if (evt === null) {
        return evt;
      }

      // If a trace context is not set on the event, we use the propagationContext set on the event to
      // generate a trace context. If the propagationContext does not have a dynamic sampling context, we
      // also generate one for it.
      const { propagationContext } = evt.sdkProcessingMetadata || {};
      const trace = evt.contexts && evt.contexts.trace;
      if (!trace && propagationContext) {
        const { traceId: trace_id, spanId, parentSpanId, dsc } = propagationContext as PropagationContext;
        evt.contexts = {
          trace: {
            trace_id,
            span_id: spanId,
            parent_span_id: parentSpanId,
          },
          ...evt.contexts,
        };

        const dynamicSamplingContext = dsc ? dsc : getDynamicSamplingContextFromClient(trace_id, this, scope);

        evt.sdkProcessingMetadata = {
          dynamicSamplingContext,
          ...evt.sdkProcessingMetadata,
        };
      }
      return evt;
    });
  }

  /**
   * Processes the event and logs an error in case of rejection
   * @param event
   * @param hint
   * @param scope
   */
  protected _captureEvent(event: Event, hint: EventHint = {}, scope?: Scope): PromiseLike<string | undefined> {
    return this._processEvent(event, hint, scope).then(
      finalEvent => {
        return finalEvent.event_id;
      },
      reason => {
        if (DEBUG_BUILD) {
          // If something's gone wrong, log the error as a warning. If it's just us having used a `SentryError` for
          // control flow, log just the message (no stack) as a log-level log.
          const sentryError = reason as SentryError;
          if (sentryError.logLevel === 'log') {
            logger.log(sentryError.message);
          } else {
            logger.warn(sentryError);
          }
        }
        return undefined;
      },
    );
  }

  /**
   * Processes an event (either error or message) and sends it to Sentry.
   *
   * This also adds breadcrumbs and context information to the event. However,
   * platform specific meta data (such as the User's IP address) must be added
   * by the SDK implementor.
   *
   *
   * @param event The event to send to Sentry.
   * @param hint May contain additional information about the original exception.
   * @param scope A scope containing event metadata.
   * @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
   */
  protected _processEvent(event: Event, hint: EventHint, scope?: Scope): PromiseLike<Event> {
    const options = this.getOptions();
    const { sampleRate } = options;

    const isTransaction = isTransactionEvent(event);
    const isError = isErrorEvent(event);
    const eventType = event.type || 'error';
    const beforeSendLabel = `before send for type \`${eventType}\``;

    // 1.0 === 100% events are sent
    // 0.0 === 0% events are sent
    // Sampling for transaction happens somewhere else
    if (isError && typeof sampleRate === 'number' && Math.random() > sampleRate) {
      this.recordDroppedEvent('sample_rate', 'error', event);
      return rejectedSyncPromise(
        new SentryError(
          `Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`,
          'log',
        ),
      );
    }

    const dataCategory: DataCategory = eventType === 'replay_event' ? 'replay' : eventType;

    return this._prepareEvent(event, hint, scope)
      .then(prepared => {
        if (prepared === null) {
          this.recordDroppedEvent('event_processor', dataCategory, event);
          throw new SentryError('An event processor returned `null`, will not send event.', 'log');
        }

        const isInternalException = hint.data && (hint.data as { __sentry__: boolean }).__sentry__ === true;
        if (isInternalException) {
          return prepared;
        }

        const result = processBeforeSend(options, prepared, hint);
        return _validateBeforeSendResult(result, beforeSendLabel);
      })
      .then(processedEvent => {
        if (processedEvent === null) {
          this.recordDroppedEvent('before_send', dataCategory, event);
          throw new SentryError(`${beforeSendLabel} returned \`null\`, will not send event.`, 'log');
        }

        const session = scope && scope.getSession();
        if (!isTransaction && session) {
          this._updateSessionFromEvent(session, processedEvent);
        }

        // None of the Sentry built event processor will update transaction name,
        // so if the transaction name has been changed by an event processor, we know
        // it has to come from custom event processor added by a user
        const transactionInfo = processedEvent.transaction_info;
        if (isTransaction && transactionInfo && processedEvent.transaction !== event.transaction) {
          const source = 'custom';
          processedEvent.transaction_info = {
            ...transactionInfo,
            source,
          };
        }

        this.sendEvent(processedEvent, hint);
        return processedEvent;
      })
      .then(null, reason => {
        if (reason instanceof SentryError) {
          throw reason;
        }

        this.captureException(reason, {
          data: {
            __sentry__: true,
          },
          originalException: reason,
        });
        throw new SentryError(
          `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.\nReason: ${reason}`,
        );
      });
  }

  /**
   * Occupies the client with processing and event
   */
  protected _process<T>(promise: PromiseLike<T>): void {
    this._numProcessing++;
    void promise.then(
      value => {
        this._numProcessing--;
        return value;
      },
      reason => {
        this._numProcessing--;
        return reason;
      },
    );
  }

  /**
   * @inheritdoc
   */
  protected _sendEnvelope(envelope: Envelope): PromiseLike<void | TransportMakeRequestResponse> | void {
    this.emit('beforeEnvelope', envelope);

    if (this._isEnabled() && this._transport) {
      return this._transport.send(envelope).then(null, reason => {
        DEBUG_BUILD && logger.error('Error while sending event:', reason);
      });
    } else {
      DEBUG_BUILD && logger.error('Transport disabled');
    }
  }

  /**
   * Clears outcomes on this client and returns them.
   */
  protected _clearOutcomes(): Outcome[] {
    const outcomes = this._outcomes;
    this._outcomes = {};
    return Object.keys(outcomes).map(key => {
      const [reason, category] = key.split(':') as [EventDropReason, DataCategory];
      return {
        reason,
        category,
        quantity: outcomes[key],
      };
    });
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public abstract eventFromException(_exception: any, _hint?: EventHint): PromiseLike<Event>;

  /**
   * @inheritDoc
   */
  public abstract eventFromMessage(
    _message: ParameterizedString,
    // eslint-disable-next-line deprecation/deprecation
    _level?: Severity | SeverityLevel,
    _hint?: EventHint,
  ): PromiseLike<Event>;
}

/**
 * Verifies that return value of configured `beforeSend` or `beforeSendTransaction` is of expected type, and returns the value if so.
 */
function _validateBeforeSendResult(
  beforeSendResult: PromiseLike<Event | null> | Event | null,
  beforeSendLabel: string,
): PromiseLike<Event | null> | Event | null {
  const invalidValueError = `${beforeSendLabel} must return \`null\` or a valid event.`;
  if (isThenable(beforeSendResult)) {
    return beforeSendResult.then(
      event => {
        if (!isPlainObject(event) && event !== null) {
          throw new SentryError(invalidValueError);
        }
        return event;
      },
      e => {
        throw new SentryError(`${beforeSendLabel} rejected with ${e}`);
      },
    );
  } else if (!isPlainObject(beforeSendResult) && beforeSendResult !== null) {
    throw new SentryError(invalidValueError);
  }
  return beforeSendResult;
}

/**
 * Process the matching `beforeSendXXX` callback.
 */
function processBeforeSend(
  options: ClientOptions,
  event: Event,
  hint: EventHint,
): PromiseLike<Event | null> | Event | null {
  const { beforeSend, beforeSendTransaction } = options;

  if (isErrorEvent(event) && beforeSend) {
    return beforeSend(event, hint);
  }

  if (isTransactionEvent(event) && beforeSendTransaction) {
    return beforeSendTransaction(event, hint);
  }

  return event;
}

function isErrorEvent(event: Event): event is ErrorEvent {
  return event.type === undefined;
}

function isTransactionEvent(event: Event): event is TransactionEvent {
  return event.type === 'transaction';
}

/**
 * Add an event processor to the current client.
 * This event processor will run for all events processed by this client.
 */
export function addEventProcessor(callback: EventProcessor): void {
  const client = getClient();

  if (!client || !client.addEventProcessor) {
    return;
  }

  client.addEventProcessor(callback);
}
