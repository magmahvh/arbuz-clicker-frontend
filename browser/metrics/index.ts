/* eslint-disable max-lines */
import type { IdleTransaction, Transaction } from '@sentry/core';
import { getActiveTransaction, setMeasurement } from '@sentry/core';
import type { Measurements, SpanContext } from '@sentry/types';
import { browserPerformanceTimeOrigin, getComponentName, htmlTreeAsString, logger, parseUrl } from '@sentry/utils';

import { spanToJSON } from '@sentry/core';
import { DEBUG_BUILD } from '../../common/debug-build';
import {
  addClsInstrumentationHandler,
  addFidInstrumentationHandler,
  addLcpInstrumentationHandler,
  addPerformanceInstrumentationHandler,
} from '../instrument';
import { WINDOW } from '../types';
import { getVisibilityWatcher } from '../web-vitals/lib/getVisibilityWatcher';
import type { NavigatorDeviceMemory, NavigatorNetworkInformation } from '../web-vitals/types';
import { _startChild, isMeasurementValue } from './utils';

const MAX_INT_AS_BYTES = 2147483647;

/**
 * Converts from milliseconds to seconds
 * @param time time in ms
 */
function msToSec(time: number): number {
  return time / 1000;
}

function getBrowserPerformanceAPI(): Performance | undefined {
  // @ts-expect-error we want to make sure all of these are available, even if TS is sure they are
  return WINDOW && WINDOW.addEventListener && WINDOW.performance;
}

let _performanceCursor: number = 0;

let _measurements: Measurements = {};
let _lcpEntry: LargestContentfulPaint | undefined;
let _clsEntry: LayoutShift | undefined;

/**
 * Start tracking web vitals.
 * The callback returned by this function can be used to stop tracking & ensure all measurements are final & captured.
 *
 * @returns A function that forces web vitals collection
 */
export function startTrackingWebVitals(): () => void {
  const performance = getBrowserPerformanceAPI();
  if (performance && browserPerformanceTimeOrigin) {
    // @ts-expect-error we want to make sure all of these are available, even if TS is sure they are
    if (performance.mark) {
      WINDOW.performance.mark('sentry-tracing-init');
    }
    const fidCallback = _trackFID();
    const clsCallback = _trackCLS();
    const lcpCallback = _trackLCP();

    return (): void => {
      fidCallback();
      clsCallback();
      lcpCallback();
    };
  }

  return () => undefined;
}

/**
 * Start tracking long tasks.
 */
export function startTrackingLongTasks(): void {
  addPerformanceInstrumentationHandler('longtask', ({ entries }) => {
    for (const entry of entries) {
      // eslint-disable-next-line deprecation/deprecation
      const transaction = getActiveTransaction() as IdleTransaction | undefined;
      if (!transaction) {
        return;
      }
      const startTime = msToSec((browserPerformanceTimeOrigin as number) + entry.startTime);
      const duration = msToSec(entry.duration);

      // eslint-disable-next-line deprecation/deprecation
      transaction.startChild({
        description: 'Main UI thread blocked',
        op: 'ui.long-task',
        origin: 'auto.ui.browser.metrics',
        startTimestamp: startTime,
        endTimestamp: startTime + duration,
      });
    }
  });
}

/**
 * Start tracking interaction events.
 */
export function startTrackingInteractions(): void {
  addPerformanceInstrumentationHandler('event', ({ entries }) => {
    for (const entry of entries) {
      // eslint-disable-next-line deprecation/deprecation
      const transaction = getActiveTransaction() as IdleTransaction | undefined;
      if (!transaction) {
        return;
      }

      if (entry.name === 'click') {
        const startTime = msToSec((browserPerformanceTimeOrigin as number) + entry.startTime);
        const duration = msToSec(entry.duration);

        const span: SpanContext = {
          description: htmlTreeAsString(entry.target),
          op: `ui.interaction.${entry.name}`,
          origin: 'auto.ui.browser.metrics',
          startTimestamp: startTime,
          endTimestamp: startTime + duration,
        };

        const componentName = getComponentName(entry.target);
        if (componentName) {
          span.attributes = { 'ui.component_name': componentName };
        }

        // eslint-disable-next-line deprecation/deprecation
        transaction.startChild(span);
      }
    }
  });
}

/** Starts tracking the Cumulative Layout Shift on the current page. */
function _trackCLS(): () => void {
  return addClsInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry) {
      return;
    }

    DEBUG_BUILD && logger.log('[Measurements] Adding CLS');
    _measurements['cls'] = { value: metric.value, unit: '' };
    _clsEntry = entry as LayoutShift;
  }, true);
}

/** Starts tracking the Largest Contentful Paint on the current page. */
function _trackLCP(): () => void {
  return addLcpInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry) {
      return;
    }

    DEBUG_BUILD && logger.log('[Measurements] Adding LCP');
    _measurements['lcp'] = { value: metric.value, unit: 'millisecond' };
    _lcpEntry = entry as LargestContentfulPaint;
  }, true);
}

/** Starts tracking the First Input Delay on the current page. */
function _trackFID(): () => void {
  return addFidInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry) {
      return;
    }

    const timeOrigin = msToSec(browserPerformanceTimeOrigin as number);
    const startTime = msToSec(entry.startTime);
    DEBUG_BUILD && logger.log('[Measurements] Adding FID');
    _measurements['fid'] = { value: metric.value, unit: 'millisecond' };
    _measurements['mark.fid'] = { value: timeOrigin + startTime, unit: 'second' };
  });
}

/** Add performance related spans to a transaction */
export function addPerformanceEntries(transaction: Transaction): void {
  const performance = getBrowserPerformanceAPI();
  if (!performance || !WINDOW.performance.getEntries || !browserPerformanceTimeOrigin) {
    // Gatekeeper if performance API not available
    return;
  }

  DEBUG_BUILD && logger.log('[Tracing] Adding & adjusting spans using Performance API');
  const timeOrigin = msToSec(browserPerformanceTimeOrigin);

  const performanceEntries = performance.getEntries();

  let responseStartTimestamp: number | undefined;
  let requestStartTimestamp: number | undefined;

  const { op, start_timestamp: transactionStartTime } = spanToJSON(transaction);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  performanceEntries.slice(_performanceCursor).forEach((entry: Record<string, any>) => {
    const startTime = msToSec(entry.startTime);
    const duration = msToSec(entry.duration);

    // eslint-disable-next-line deprecation/deprecation
    if (transaction.op === 'navigation' && transactionStartTime && timeOrigin + startTime < transactionStartTime) {
      return;
    }

    switch (entry.entryType) {
      case 'navigation': {
        _addNavigationSpans(transaction, entry, timeOrigin);
        responseStartTimestamp = timeOrigin + msToSec(entry.responseStart);
        requestStartTimestamp = timeOrigin + msToSec(entry.requestStart);
        break;
      }
      case 'mark':
      case 'paint':
      case 'measure': {
        _addMeasureSpans(transaction, entry, startTime, duration, timeOrigin);

        // capture web vitals
        const firstHidden = getVisibilityWatcher();
        // Only report if the page wasn't hidden prior to the web vital.
        const shouldRecord = entry.startTime < firstHidden.firstHiddenTime;

        if (entry.name === 'first-paint' && shouldRecord) {
          DEBUG_BUILD && logger.log('[Measurements] Adding FP');
          _measurements['fp'] = { value: entry.startTime, unit: 'millisecond' };
        }
        if (entry.name === 'first-contentful-paint' && shouldRecord) {
          DEBUG_BUILD && logger.log('[Measurements] Adding FCP');
          _measurements['fcp'] = { value: entry.startTime, unit: 'millisecond' };
        }
        break;
      }
      case 'resource': {
        _addResourceSpans(transaction, entry, entry.name as string, startTime, duration, timeOrigin);
        break;
      }
      default:
      // Ignore other entry types.
    }
  });

  _performanceCursor = Math.max(performanceEntries.length - 1, 0);

  _trackNavigator(transaction);

  // Measurements are only available for pageload transactions
  if (op === 'pageload') {
    _addTtfbToMeasurements(_measurements, responseStartTimestamp, requestStartTimestamp, transactionStartTime);

    ['fcp', 'fp', 'lcp'].forEach(name => {
      if (!_measurements[name] || !transactionStartTime || timeOrigin >= transactionStartTime) {
        return;
      }
      // The web vitals, fcp, fp, lcp, and ttfb, all measure relative to timeOrigin.
      // Unfortunately, timeOrigin is not captured within the transaction span data, so these web vitals will need
      // to be adjusted to be relative to transaction.startTimestamp.
      const oldValue = _measurements[name].value;
      const measurementTimestamp = timeOrigin + msToSec(oldValue);

      // normalizedValue should be in milliseconds
      const normalizedValue = Math.abs((measurementTimestamp - transactionStartTime) * 1000);
      const delta = normalizedValue - oldValue;

      DEBUG_BUILD && logger.log(`[Measurements] Normalized ${name} from ${oldValue} to ${normalizedValue} (${delta})`);
      _measurements[name].value = normalizedValue;
    });

    const fidMark = _measurements['mark.fid'];
    if (fidMark && _measurements['fid']) {
      // create span for FID
      _startChild(transaction, {
        description: 'first input delay',
        endTimestamp: fidMark.value + msToSec(_measurements['fid'].value),
        op: 'ui.action',
        origin: 'auto.ui.browser.metrics',
        startTimestamp: fidMark.value,
      });

      // Delete mark.fid as we don't want it to be part of final payload
      delete _measurements['mark.fid'];
    }

    // If FCP is not recorded we should not record the cls value
    // according to the new definition of CLS.
    if (!('fcp' in _measurements)) {
      delete _measurements.cls;
    }

    Object.keys(_measurements).forEach(measurementName => {
      setMeasurement(measurementName, _measurements[measurementName].value, _measurements[measurementName].unit);
    });

    _tagMetricInfo(transaction);
  }

  _lcpEntry = undefined;
  _clsEntry = undefined;
  _measurements = {};
}

/** Create measure related spans */
export function _addMeasureSpans(
  transaction: Transaction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: Record<string, any>,
  startTime: number,
  duration: number,
  timeOrigin: number,
): number {
  const measureStartTimestamp = timeOrigin + startTime;
  const measureEndTimestamp = measureStartTimestamp + duration;

  _startChild(transaction, {
    description: entry.name as string,
    endTimestamp: measureEndTimestamp,
    op: entry.entryType as string,
    origin: 'auto.resource.browser.metrics',
    startTimestamp: measureStartTimestamp,
  });

  return measureStartTimestamp;
}

/** Instrument navigation entries */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _addNavigationSpans(transaction: Transaction, entry: Record<string, any>, timeOrigin: number): void {
  ['unloadEvent', 'redirect', 'domContentLoadedEvent', 'loadEvent', 'connect'].forEach(event => {
    _addPerformanceNavigationTiming(transaction, entry, event, timeOrigin);
  });
  _addPerformanceNavigationTiming(transaction, entry, 'secureConnection', timeOrigin, 'TLS/SSL', 'connectEnd');
  _addPerformanceNavigationTiming(transaction, entry, 'fetch', timeOrigin, 'cache', 'domainLookupStart');
  _addPerformanceNavigationTiming(transaction, entry, 'domainLookup', timeOrigin, 'DNS');
  _addRequest(transaction, entry, timeOrigin);
}

/** Create performance navigation related spans */
function _addPerformanceNavigationTiming(
  transaction: Transaction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: Record<string, any>,
  event: string,
  timeOrigin: number,
  description?: string,
  eventEnd?: string,
): void {
  const end = eventEnd ? (entry[eventEnd] as number | undefined) : (entry[`${event}End`] as number | undefined);
  const start = entry[`${event}Start`] as number | undefined;
  if (!start || !end) {
    return;
  }
  _startChild(transaction, {
    op: 'browser',
    origin: 'auto.browser.browser.metrics',
    description: description || event,
    startTimestamp: timeOrigin + msToSec(start),
    endTimestamp: timeOrigin + msToSec(end),
  });
}

/** Create request and response related spans */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _addRequest(transaction: Transaction, entry: Record<string, any>, timeOrigin: number): void {
  if (entry.responseEnd) {
    // It is possible that we are collecting these metrics when the page hasn't finished loading yet, for example when the HTML slowly streams in.
    // In this case, ie. when the document request hasn't finished yet, `entry.responseEnd` will be 0.
    // In order not to produce faulty spans, where the end timestamp is before the start timestamp, we will only collect
    // these spans when the responseEnd value is available. The backend (Relay) would drop the entire transaction if it contained faulty spans.
    _startChild(transaction, {
      op: 'browser',
      origin: 'auto.browser.browser.metrics',
      description: 'request',
      startTimestamp: timeOrigin + msToSec(entry.requestStart as number),
      endTimestamp: timeOrigin + msToSec(entry.responseEnd as number),
    });

    _startChild(transaction, {
      op: 'browser',
      origin: 'auto.browser.browser.metrics',
      description: 'response',
      startTimestamp: timeOrigin + msToSec(entry.responseStart as number),
      endTimestamp: timeOrigin + msToSec(entry.responseEnd as number),
    });
  }
}

export interface ResourceEntry extends Record<string, unknown> {
  initiatorType?: string;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
  renderBlockingStatus?: string;
}

/** Create resource-related spans */
export function _addResourceSpans(
  transaction: Transaction,
  entry: ResourceEntry,
  resourceUrl: string,
  startTime: number,
  duration: number,
  timeOrigin: number,
): void {
  // we already instrument based on fetch and xhr, so we don't need to
  // duplicate spans here.
  if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
    return;
  }

  const parsedUrl = parseUrl(resourceUrl);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  setResourceEntrySizeData(data, entry, 'transferSize', 'http.response_transfer_size');
  setResourceEntrySizeData(data, entry, 'encodedBodySize', 'http.response_content_length');
  setResourceEntrySizeData(data, entry, 'decodedBodySize', 'http.decoded_response_content_length');

  if ('renderBlockingStatus' in entry) {
    data['resource.render_blocking_status'] = entry.renderBlockingStatus;
  }
  if (parsedUrl.protocol) {
    data['url.scheme'] = parsedUrl.protocol.split(':').pop(); // the protocol returned by parseUrl includes a :, but OTEL spec does not, so we remove it.
  }

  if (parsedUrl.host) {
    data['server.address'] = parsedUrl.host;
  }

  data['url.same_origin'] = resourceUrl.includes(WINDOW.location.origin);

  const startTimestamp = timeOrigin + startTime;
  const endTimestamp = startTimestamp + duration;

  _startChild(transaction, {
    description: resourceUrl.replace(WINDOW.location.origin, ''),
    endTimestamp,
    op: entry.initiatorType ? `resource.${entry.initiatorType}` : 'resource.other',
    origin: 'auto.resource.browser.metrics',
    startTimestamp,
    data,
  });
}

/**
 * Capture the information of the user agent.
 */
function _trackNavigator(transaction: Transaction): void {
  const navigator = WINDOW.navigator as null | (Navigator & NavigatorNetworkInformation & NavigatorDeviceMemory);
  if (!navigator) {
    return;
  }

  // track network connectivity
  const connection = navigator.connection;
  if (connection) {
    if (connection.effectiveType) {
      // TODO: Can we rewrite this to an attribute?
      // eslint-disable-next-line deprecation/deprecation
      transaction.setTag('effectiveConnectionType', connection.effectiveType);
    }

    if (connection.type) {
      // TODO: Can we rewrite this to an attribute?
      // eslint-disable-next-line deprecation/deprecation
      transaction.setTag('connectionType', connection.type);
    }

    if (isMeasurementValue(connection.rtt)) {
      _measurements['connection.rtt'] = { value: connection.rtt, unit: 'millisecond' };
    }
  }

  if (isMeasurementValue(navigator.deviceMemory)) {
    // TODO: Can we rewrite this to an attribute?
    // eslint-disable-next-line deprecation/deprecation
    transaction.setTag('deviceMemory', `${navigator.deviceMemory} GB`);
  }

  if (isMeasurementValue(navigator.hardwareConcurrency)) {
    // TODO: Can we rewrite this to an attribute?
    // eslint-disable-next-line deprecation/deprecation
    transaction.setTag('hardwareConcurrency', String(navigator.hardwareConcurrency));
  }
}

/** Add LCP / CLS data to transaction to allow debugging */
function _tagMetricInfo(transaction: Transaction): void {
  if (_lcpEntry) {
    DEBUG_BUILD && logger.log('[Measurements] Adding LCP Data');

    // Capture Properties of the LCP element that contributes to the LCP.

    if (_lcpEntry.element) {
      // TODO: Can we rewrite this to an attribute?
      // eslint-disable-next-line deprecation/deprecation
      transaction.setTag('lcp.element', htmlTreeAsString(_lcpEntry.element));
    }

    if (_lcpEntry.id) {
      // TODO: Can we rewrite this to an attribute?
      // eslint-disable-next-line deprecation/deprecation
      transaction.setTag('lcp.id', _lcpEntry.id);
    }

    if (_lcpEntry.url) {
      // Trim URL to the first 200 characters.
      // TODO: Can we rewrite this to an attribute?
      // eslint-disable-next-line deprecation/deprecation
      transaction.setTag('lcp.url', _lcpEntry.url.trim().slice(0, 200));
    }

    // TODO: Can we rewrite this to an attribute?
    // eslint-disable-next-line deprecation/deprecation
    transaction.setTag('lcp.size', _lcpEntry.size);
  }

  // See: https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift
  if (_clsEntry && _clsEntry.sources) {
    DEBUG_BUILD && logger.log('[Measurements] Adding CLS Data');
    _clsEntry.sources.forEach((source, index) =>
      // TODO: Can we rewrite this to an attribute?
      // eslint-disable-next-line deprecation/deprecation
      transaction.setTag(`cls.source.${index + 1}`, htmlTreeAsString(source.node)),
    );
  }
}

function setResourceEntrySizeData(
  data: Record<string, unknown>,
  entry: ResourceEntry,
  key: keyof Pick<ResourceEntry, 'transferSize' | 'encodedBodySize' | 'decodedBodySize'>,
  dataKey: 'http.response_transfer_size' | 'http.response_content_length' | 'http.decoded_response_content_length',
): void {
  const entryVal = entry[key];
  if (entryVal != null && entryVal < MAX_INT_AS_BYTES) {
    data[dataKey] = entryVal;
  }
}

/**
 * Add ttfb information to measurements
 *
 * Exported for tests
 */
export function _addTtfbToMeasurements(
  _measurements: Measurements,
  responseStartTimestamp: number | undefined,
  requestStartTimestamp: number | undefined,
  transactionStartTime: number | undefined,
): void {
  // Generate TTFB (Time to First Byte), which measured as the time between the beginning of the transaction and the
  // start of the response in milliseconds
  if (typeof responseStartTimestamp === 'number' && transactionStartTime) {
    DEBUG_BUILD && logger.log('[Measurements] Adding TTFB');
    _measurements['ttfb'] = {
      // As per https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/responseStart,
      // responseStart can be 0 if the request is coming straight from the cache.
      // This might lead us to calculate a negative ttfb if we don't use Math.max here.
      //
      // This logic is the same as what is in the web-vitals library to calculate ttfb
      // https://github.com/GoogleChrome/web-vitals/blob/2301de5015e82b09925238a228a0893635854587/src/onTTFB.ts#L92
      // TODO(abhi): We should use the web-vitals library instead of this custom calculation.
      value: Math.max(responseStartTimestamp - transactionStartTime, 0) * 1000,
      unit: 'millisecond',
    };

    if (typeof requestStartTimestamp === 'number' && requestStartTimestamp <= responseStartTimestamp) {
      // Capture the time spent making the request and receiving the first byte of the response.
      // This is the time between the start of the request and the start of the response in milliseconds.
      _measurements['ttfb.requestTime'] = {
        value: (responseStartTimestamp - requestStartTimestamp) * 1000,
        unit: 'millisecond',
      };
    }
  }
}
