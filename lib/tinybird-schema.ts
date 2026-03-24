import {
  defineDatasource,
  defineEndpoint,
  Tinybird,
  node,
  t,
  p,
  engine,
} from "@tinybirdco/sdk";

// Datasources

export const page_views__v3 = defineDatasource("page_views__v3", {
  schema: {
    id: t.string(),
    linkId: t.string(),
    documentId: t.string(),
    viewId: t.string(),
    dataroomId: t.string().nullable(),
    versionNumber: t.uint16().default(1),
    time: t.int64(),
    duration: t.int64(),
    pageNumber: t.string(),
    country: t.string().default("Unknown"),
    city: t.string().default("Unknown"),
    region: t.string().default("Unknown"),
    latitude: t.string().default("Unknown"),
    longitude: t.string().default("Unknown"),
    ua: t.string().default("Unknown"),
    browser: t.string().default("Unknown"),
    browser_version: t.string().default("Unknown"),
    engine_name: t.string().default("Unknown"),
    engine_version: t.string().default("Unknown"),
    os: t.string().default("Unknown"),
    os_version: t.string().default("Unknown"),
    device: t.string().default("Desktop"),
    device_vendor: t.string().default("Unknown"),
    device_model: t.string().default("Unknown"),
    cpu_architecture: t.string().default("Unknown"),
    bot: t.uint8().default(0),
    referer: t.string().default("(direct)"),
    referer_url: t.string().default("(direct)"),
  },
  engine: engine.mergeTree({
    sortingKey: ["documentId", "viewId", "pageNumber", "time"],
  }),
});

export const webhook_events__v1 = defineDatasource("webhook_events__v1", {
  schema: {
    event_id: t.string(),
    webhook_id: t.string(),
    message_id: t.string(),
    event: t.string(),
    url: t.string(),
    http_status: t.int32(),
    request_body: t.string(),
    response_body: t.string(),
  },
  engine: engine.mergeTree({
    sortingKey: ["webhook_id", "event_id"],
  }),
});

export const video_views__v1 = defineDatasource("video_views__v1", {
  schema: {
    timestamp: t.string(),
    id: t.string(),
    link_id: t.string(),
    document_id: t.string(),
    view_id: t.string(),
    dataroom_id: t.string().nullable(),
    version_number: t.int32(),
    event_type: t.string(),
    start_time: t.float64(),
    end_time: t.float64().default(0),
    playback_rate: t.float64(),
    volume: t.float64(),
    is_muted: t.uint8(),
    is_focused: t.uint8(),
    is_fullscreen: t.uint8(),
    country: t.string().default("Unknown"),
    city: t.string().default("Unknown"),
    region: t.string().default("Unknown"),
    latitude: t.string().default("Unknown"),
    longitude: t.string().default("Unknown"),
    ua: t.string().default("Unknown"),
    browser: t.string().default("Unknown"),
    browser_version: t.string().default("Unknown"),
    engine_name: t.string().default("Unknown"),
    engine_version: t.string().default("Unknown"),
    os: t.string().default("Unknown"),
    os_version: t.string().default("Unknown"),
    device: t.string().default("Desktop"),
    device_vendor: t.string().default("Unknown"),
    device_model: t.string().default("Unknown"),
    cpu_architecture: t.string().default("Unknown"),
    bot: t.uint8().default(0),
    referer: t.string().default("(direct)"),
    referer_url: t.string().default("(direct)"),
    ip_address: t.string().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: ["document_id", "view_id", "timestamp"],
  }),
});

export const click_events__v1 = defineDatasource("click_events__v1", {
  schema: {
    timestamp: t.string(),
    event_id: t.string(),
    session_id: t.string(),
    link_id: t.string(),
    document_id: t.string(),
    view_id: t.string(),
    page_number: t.string(),
    href: t.string(),
    version_number: t.int32(),
    dataroom_id: t.string().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: ["document_id", "view_id", "timestamp"],
  }),
});

export const pm_click_events__v1 = defineDatasource("pm_click_events__v1", {
  schema: {
    timestamp: t.string(),
    click_id: t.string(),
    view_id: t.string(),
    link_id: t.string(),
    document_id: t.string().nullable(),
    dataroom_id: t.string().nullable(),
    continent: t.string().default("Unknown"),
    country: t.string().default("Unknown"),
    city: t.string().default("Unknown"),
    region: t.string().default("Unknown"),
    latitude: t.string().default("Unknown"),
    longitude: t.string().default("Unknown"),
    device: t.string().default("Desktop"),
    device_model: t.string().default("Unknown"),
    device_vendor: t.string().default("Unknown"),
    browser: t.string().default("Unknown"),
    browser_version: t.string().default("Unknown"),
    os: t.string().default("Unknown"),
    os_version: t.string().default("Unknown"),
    engine_name: t.string().default("Unknown"),
    engine_version: t.string().default("Unknown"),
    cpu_architecture: t.string().default("Unknown"),
    ua: t.string().default("Unknown"),
    bot: t.uint8().default(0),
    referer: t.string().default("(direct)"),
    referer_url: t.string().default("(direct)"),
    ip_address: t.string().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: ["link_id", "timestamp"],
  }),
});

// Pipes

export const get_total_average_page_duration__v5 = defineEndpoint("get_total_average_page_duration__v5", {
  params: { documentId: p.string(), excludedLinkIds: p.string().optional(""), excludedViewIds: p.string().optional(""), since: p.int64().optional(0) },
  nodes: [node({ sql: `SELECT versionNumber, pageNumber, avg(duration) as avg_duration FROM page_views__v3 WHERE documentId = {{String(documentId)}} AND time >= {{Int64(since, 0)}} AND ({{String(excludedViewIds, '')}} = '' OR NOT has(splitByChar(',', {{String(excludedViewIds, '')}}), viewId)) AND ({{String(excludedLinkIds, '')}} = '' OR NOT has(splitByChar(',', {{String(excludedLinkIds, '')}}), linkId)) GROUP BY versionNumber, pageNumber ORDER BY versionNumber DESC, pageNumber ASC` })],
  output: { versionNumber: t.uint16(), pageNumber: t.string(), avg_duration: t.float64() },
});

export const get_page_duration_per_view__v5 = defineEndpoint("get_page_duration_per_view__v5", {
  params: { documentId: p.string(), viewId: p.string(), since: p.int64().optional(0) },
  nodes: [node({ sql: `SELECT pageNumber, sum(duration) as sum_duration FROM page_views__v3 WHERE documentId = {{String(documentId)}} AND viewId = {{String(viewId)}} AND time >= {{Int64(since, 0)}} GROUP BY pageNumber ORDER BY pageNumber ASC` })],
  output: { pageNumber: t.string(), sum_duration: t.float64() },
});

export const get_total_document_duration__v1 = defineEndpoint("get_total_document_duration__v1", {
  params: { documentId: p.string(), excludedLinkIds: p.string().optional(""), excludedViewIds: p.string().optional(""), since: p.int64().optional(0) },
  nodes: [node({ sql: `SELECT sum(duration) as sum_duration FROM page_views__v3 WHERE documentId = {{String(documentId)}} AND time >= {{Int64(since, 0)}} AND ({{String(excludedViewIds, '')}} = '' OR NOT has(splitByChar(',', {{String(excludedViewIds, '')}}), viewId)) AND ({{String(excludedLinkIds, '')}} = '' OR NOT has(splitByChar(',', {{String(excludedLinkIds, '')}}), linkId))` })],
  output: { sum_duration: t.float64() },
});

export const get_total_link_duration__v1 = defineEndpoint("get_total_link_duration__v1", {
  params: { linkId: p.string(), documentId: p.string(), excludedViewIds: p.string().optional(""), since: p.int64().optional(0) },
  nodes: [node({ sql: `SELECT sum(duration) as sum_duration, uniq(viewId) as view_count FROM page_views__v3 WHERE documentId = {{String(documentId)}} AND linkId = {{String(linkId)}} AND time >= {{Int64(since, 0)}} AND ({{String(excludedViewIds, '')}} = '' OR NOT has(splitByChar(',', {{String(excludedViewIds, '')}}), viewId))` })],
  output: { sum_duration: t.float64(), view_count: t.uint64() },
});

export const get_total_viewer_duration__v1 = defineEndpoint("get_total_viewer_duration__v1", {
  params: { viewIds: p.string(), since: p.int64().optional(0) },
  nodes: [node({ sql: `SELECT sum(duration) as sum_duration FROM page_views__v3 WHERE has(splitByChar(',', {{String(viewIds)}}), viewId) AND time >= {{Int64(since, 0)}}` })],
  output: { sum_duration: t.float64() },
});

export const get_useragent_per_view__v2 = defineEndpoint("get_useragent_per_view__v2", {
  params: { documentId: p.string(), viewId: p.string(), since: p.int64().optional(0) },
  nodes: [node({ sql: `SELECT country, city, browser, os, device FROM page_views__v3 WHERE documentId = {{String(documentId)}} AND viewId = {{String(viewId)}} LIMIT 1` })],
  output: { country: t.string(), city: t.string(), browser: t.string(), os: t.string(), device: t.string() },
});

export const get_useragent_per_view__v3 = defineEndpoint("get_useragent_per_view__v3", {
  params: { viewId: p.string() },
  nodes: [node({ sql: `SELECT country, city, browser, os, device FROM page_views__v3 WHERE viewId = {{String(viewId)}} LIMIT 1` })],
  output: { country: t.string(), city: t.string(), browser: t.string(), os: t.string(), device: t.string() },
});

export const get_total_dataroom_duration__v1 = defineEndpoint("get_total_dataroom_duration__v1", {
  params: { dataroomId: p.string(), since: p.int64().optional(0) },
  nodes: [node({ sql: `SELECT viewId, sum(duration) as sum_duration FROM page_views__v3 WHERE dataroomId = {{String(dataroomId)}} AND time >= {{Int64(since, 0)}} GROUP BY viewId` })],
  output: { viewId: t.string(), sum_duration: t.float64() },
});

export const get_document_duration_per_viewer__v1 = defineEndpoint("get_document_duration_per_viewer__v1", {
  params: { documentId: p.string(), viewIds: p.string() },
  nodes: [node({ sql: `SELECT sum(duration) as sum_duration FROM page_views__v3 WHERE documentId = {{String(documentId)}} AND has(splitByChar(',', {{String(viewIds)}}), viewId)` })],
  output: { sum_duration: t.float64() },
});

export const get_webhook_events__v1 = defineEndpoint("get_webhook_events__v1", {
  params: { webhookId: p.string() },
  nodes: [node({ sql: `SELECT event_id, webhook_id, message_id, event, url, http_status, request_body, response_body FROM webhook_events__v1 WHERE webhook_id = {{String(webhookId)}} ORDER BY event_id DESC` })],
  output: { event_id: t.string(), webhook_id: t.string(), message_id: t.string(), event: t.string(), url: t.string(), http_status: t.int32(), request_body: t.string(), response_body: t.string() },
});

export const get_video_events_by_document__v1 = defineEndpoint("get_video_events_by_document__v1", {
  params: { document_id: p.string() },
  nodes: [node({ sql: `SELECT timestamp, view_id, event_type, start_time, end_time, playback_rate, volume, is_muted, is_focused, is_fullscreen FROM video_views__v1 WHERE document_id = {{String(document_id)}} ORDER BY timestamp ASC` })],
  output: { timestamp: t.string(), view_id: t.string(), event_type: t.string(), start_time: t.float64(), end_time: t.float64(), playback_rate: t.float64(), volume: t.float64(), is_muted: t.uint8(), is_focused: t.uint8(), is_fullscreen: t.uint8() },
});

export const get_video_events_by_view__v1 = defineEndpoint("get_video_events_by_view__v1", {
  params: { document_id: p.string(), view_id: p.string() },
  nodes: [node({ sql: `SELECT timestamp, event_type, start_time, end_time FROM video_views__v1 WHERE document_id = {{String(document_id)}} AND view_id = {{String(view_id)}} ORDER BY timestamp ASC` })],
  output: { timestamp: t.string(), event_type: t.string(), start_time: t.float64(), end_time: t.float64() },
});

export const get_click_events_by_view__v1 = defineEndpoint("get_click_events_by_view__v1", {
  params: { document_id: p.string(), view_id: p.string() },
  nodes: [node({ sql: `SELECT timestamp, document_id, dataroom_id, view_id, page_number, version_number, href FROM click_events__v1 WHERE document_id = {{String(document_id)}} AND view_id = {{String(view_id)}} ORDER BY timestamp ASC` })],
  output: { timestamp: t.string(), document_id: t.string(), dataroom_id: t.string().nullable(), view_id: t.string(), page_number: t.string(), version_number: t.int32(), href: t.string() },
});

// Client
export const tinybird = new Tinybird({
  datasources: { page_views__v3, webhook_events__v1, video_views__v1, click_events__v1, pm_click_events__v1 },
  pipes: { get_total_average_page_duration__v5, get_page_duration_per_view__v5, get_total_document_duration__v1, get_total_link_duration__v1, get_total_viewer_duration__v1, get_useragent_per_view__v2, get_useragent_per_view__v3, get_total_dataroom_duration__v1, get_document_duration_per_viewer__v1, get_webhook_events__v1, get_video_events_by_document__v1, get_video_events_by_view__v1, get_click_events_by_view__v1 },
});
