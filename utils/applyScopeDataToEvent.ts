import type { Breadcrumb, Event, PropagationContext, ScopeData, Span } from '@sentry/types';
import { arrayify, dropUndefinedKeys } from '@sentry/utils';
import { getDynamicSamplingContextFromSpan } from '../tracing/dynamicSamplingContext';
import { getRootSpan } from './getRootSpan';
import { spanToJSON, spanToTraceContext } from './spanUtils';

/**
 * Applies data from the scope to the event and runs all event processors on it.
 */
export function applyScopeDataToEvent(event: Event, data: ScopeData): void {
  const { fingerprint, span, breadcrumbs, sdkProcessingMetadata, propagationContext } = data;

  // Apply general data
  applyDataToEvent(event, data);

  // We want to set the trace context for normal events only if there isn't already
  // a trace context on the event. There is a product feature in place where we link
  // errors with transaction and it relies on that.
  if (span) {
    applySpanToEvent(event, span);
  }

  applyFingerprintToEvent(event, fingerprint);
  applyBreadcrumbsToEvent(event, breadcrumbs);
  applySdkMetadataToEvent(event, sdkProcessingMetadata, propagationContext);
}

/** Merge data of two scopes together. */
export function mergeScopeData(data: ScopeData, mergeData: ScopeData): void {
  const {
    extra,
    tags,
    user,
    contexts,
    level,
    sdkProcessingMetadata,
    breadcrumbs,
    fingerprint,
    eventProcessors,
    attachments,
    propagationContext,
    // eslint-disable-next-line deprecation/deprecation
    transactionName,
    span,
  } = mergeData;

  mergeAndOverwriteScopeData(data, 'extra', extra);
  mergeAndOverwriteScopeData(data, 'tags', tags);
  mergeAndOverwriteScopeData(data, 'user', user);
  mergeAndOverwriteScopeData(data, 'contexts', contexts);
  mergeAndOverwriteScopeData(data, 'sdkProcessingMetadata', sdkProcessingMetadata);

  if (level) {
    data.level = level;
  }

  if (transactionName) {
    // eslint-disable-next-line deprecation/deprecation
    data.transactionName = transactionName;
  }

  if (span) {
    data.span = span;
  }

  if (breadcrumbs.length) {
    data.breadcrumbs = [...data.breadcrumbs, ...breadcrumbs];
  }

  if (fingerprint.length) {
    data.fingerprint = [...data.fingerprint, ...fingerprint];
  }

  if (eventProcessors.length) {
    data.eventProcessors = [...data.eventProcessors, ...eventProcessors];
  }

  if (attachments.length) {
    data.attachments = [...data.attachments, ...attachments];
  }

  data.propagationContext = { ...data.propagationContext, ...propagationContext };
}

/**
 * Merges certain scope data. Undefined values will overwrite any existing values.
 * Exported only for tests.
 */
export function mergeAndOverwriteScopeData<
  Prop extends 'extra' | 'tags' | 'user' | 'contexts' | 'sdkProcessingMetadata',
  Data extends ScopeData,
>(data: Data, prop: Prop, mergeVal: Data[Prop]): void {
  if (mergeVal && Object.keys(mergeVal).length) {
    // Clone object
    data[prop] = { ...data[prop] };
    for (const key in mergeVal) {
      if (Object.prototype.hasOwnProperty.call(mergeVal, key)) {
        data[prop][key] = mergeVal[key];
      }
    }
  }
}

/** Exported only for tests */
export function mergeArray<Prop extends 'breadcrumbs' | 'fingerprint'>(
  event: Event,
  prop: Prop,
  mergeVal: ScopeData[Prop],
): void {
  const prevVal = event[prop];
  // If we are not merging any new values,
  // we only need to proceed if there was an empty array before (as we want to replace it with undefined)
  if (!mergeVal.length && (!prevVal || prevVal.length)) {
    return;
  }

  const merged = [...(prevVal || []), ...mergeVal] as ScopeData[Prop];
  event[prop] = merged.length ? merged : undefined;
}

function applyDataToEvent(event: Event, data: ScopeData): void {
  const {
    extra,
    tags,
    user,
    contexts,
    level,
    // eslint-disable-next-line deprecation/deprecation
    transactionName,
  } = data;

  const cleanedExtra = dropUndefinedKeys(extra);
  if (cleanedExtra && Object.keys(cleanedExtra).length) {
    event.extra = { ...cleanedExtra, ...event.extra };
  }

  const cleanedTags = dropUndefinedKeys(tags);
  if (cleanedTags && Object.keys(cleanedTags).length) {
    event.tags = { ...cleanedTags, ...event.tags };
  }

  const cleanedUser = dropUndefinedKeys(user);
  if (cleanedUser && Object.keys(cleanedUser).length) {
    event.user = { ...cleanedUser, ...event.user };
  }

  const cleanedContexts = dropUndefinedKeys(contexts);
  if (cleanedContexts && Object.keys(cleanedContexts).length) {
    event.contexts = { ...cleanedContexts, ...event.contexts };
  }

  if (level) {
    event.level = level;
  }

  if (transactionName) {
    event.transaction = transactionName;
  }
}

function applyBreadcrumbsToEvent(event: Event, breadcrumbs: Breadcrumb[]): void {
  const mergedBreadcrumbs = [...(event.breadcrumbs || []), ...breadcrumbs];
  event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : undefined;
}

function applySdkMetadataToEvent(
  event: Event,
  sdkProcessingMetadata: ScopeData['sdkProcessingMetadata'],
  propagationContext: PropagationContext,
): void {
  event.sdkProcessingMetadata = {
    ...event.sdkProcessingMetadata,
    ...sdkProcessingMetadata,
    propagationContext: propagationContext,
  };
}

function applySpanToEvent(event: Event, span: Span): void {
  event.contexts = { trace: spanToTraceContext(span), ...event.contexts };
  const rootSpan = getRootSpan(span);
  if (rootSpan) {
    event.sdkProcessingMetadata = {
      dynamicSamplingContext: getDynamicSamplingContextFromSpan(span),
      ...event.sdkProcessingMetadata,
    };
    const transactionName = spanToJSON(rootSpan).description;
    if (transactionName) {
      event.tags = { transaction: transactionName, ...event.tags };
    }
  }
}

/**
 * Applies fingerprint from the scope to the event if there's one,
 * uses message if there's one instead or get rid of empty fingerprint
 */
function applyFingerprintToEvent(event: Event, fingerprint: ScopeData['fingerprint'] | undefined): void {
  // Make sure it's an array first and we actually have something in place
  event.fingerprint = event.fingerprint ? arrayify(event.fingerprint) : [];

  // If we have something on the scope, then merge it with event
  if (fingerprint) {
    event.fingerprint = event.fingerprint.concat(fingerprint);
  }

  // If we have no data at all, remove empty array default
  if (event.fingerprint && !event.fingerprint.length) {
    delete event.fingerprint;
  }
}
