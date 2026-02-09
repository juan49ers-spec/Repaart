"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudLogger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
exports.withLogging = withLogging;
exports.cleanupOldLogs = cleanupOldLogs;
const admin = __importStar(require("firebase-admin"));
// Log levels
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["CRITICAL"] = "critical";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// Logger class
class CloudLogger {
    constructor(context = {}) {
        this.metadata = {};
        this.executionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.context = Object.assign({ executionId: this.executionId }, context);
    }
    // Set context
    setContext(context) {
        this.context = Object.assign(Object.assign({}, this.context), context);
        return this;
    }
    // Set metadata
    setMetadata(metadata) {
        this.metadata = Object.assign(Object.assign({}, this.metadata), metadata);
        return this;
    }
    // Log methods
    debug(message, metadata) {
        this.log(LogLevel.DEBUG, message, metadata);
    }
    info(message, metadata) {
        this.log(LogLevel.INFO, message, metadata);
    }
    warn(message, metadata) {
        this.log(LogLevel.WARN, message, metadata);
    }
    error(message, error, metadata) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.log(LogLevel.ERROR, message, metadata, err);
    }
    critical(message, error, metadata) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.log(LogLevel.CRITICAL, message, metadata, err);
    }
    // Core log method
    log(level, message, metadata, error) {
        const entry = {
            level,
            message,
            timestamp: new Date(),
            context: this.context,
            metadata: Object.assign(Object.assign({}, this.metadata), metadata),
            error,
        };
        // Format log for console
        const formattedMessage = this.formatLog(entry);
        console.log(formattedMessage);
        // Write to Firestore logs collection (for async logs)
        this.writeToFirestore(entry);
        // Send to Sentry for errors
        if (error && (level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
            this.sendToSentry(entry);
        }
    }
    // Format log for console
    formatLog(entry) {
        const { level, message, timestamp, context, error } = entry;
        const time = timestamp.toISOString();
        const ctx = context ? JSON.stringify(context) : '{}';
        const meta = entry.metadata ? JSON.stringify(entry.metadata) : '{}';
        const err = error ? ` | Error: ${error.message}` : '';
        return `[${time}] [${level.toUpperCase()}] ${ctx} | ${message} ${meta}${err}`;
    }
    // Write to Firestore
    async writeToFirestore(entry) {
        try {
            const logsRef = admin.firestore().collection('cloud_logs');
            await logsRef.add({
                level: entry.level,
                message: entry.message,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                context: entry.context,
                metadata: entry.metadata,
                error: entry.error ? {
                    message: entry.error.message,
                    stack: entry.error.stack,
                    name: entry.error.name,
                } : null,
            });
        }
        catch (error) {
            // Don't throw to avoid infinite loops
            console.error('Failed to write log to Firestore:', error);
        }
    }
    // Send to Sentry (if configured)
    sendToSentry(entry) {
        try {
            if (!entry.error)
                return;
            // You would need to configure Sentry in Cloud Functions
            // This is a placeholder for Sentry integration
            console.log('Would send to Sentry:', {
                message: entry.message,
                error: entry.error,
                context: entry.context,
                metadata: entry.metadata,
            });
        }
        catch (error) {
            console.error('Failed to send to Sentry:', error);
        }
    }
}
exports.CloudLogger = CloudLogger;
// Create logger for Cloud Functions
function createLogger(functionId, context) {
    var _a, _b, _c, _d, _e, _f, _g;
    const userId = (_a = context === null || context === void 0 ? void 0 : context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const requestId = (_c = (_b = context === null || context === void 0 ? void 0 : context.rawRequest) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c['x-request-id'];
    const userAgent = (_e = (_d = context === null || context === void 0 ? void 0 : context.rawRequest) === null || _d === void 0 ? void 0 : _d.headers) === null || _e === void 0 ? void 0 : _e['user-agent'];
    const ip = (_g = (_f = context === null || context === void 0 ? void 0 : context.rawRequest) === null || _f === void 0 ? void 0 : _f.headers) === null || _g === void 0 ? void 0 : _g['x-forwarded-for'];
    return new CloudLogger({
        functionId,
        userId,
        requestId,
        userAgent,
        ip,
    });
}
// Middleware for automatic logging
function withLogging(functionId, handler) {
    return async (...args) => {
        const logger = new CloudLogger({ functionId });
        const startTime = Date.now();
        logger.info(`${functionId} started`);
        try {
            const result = await handler(logger, ...args);
            const duration = Date.now() - startTime;
            logger.info(`${functionId} completed`, { duration });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`${functionId} failed`, error, { duration });
            throw error;
        }
    };
}
// Log cleanup function (run periodically)
async function cleanupOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    try {
        const logsRef = admin.firestore().collection('cloud_logs');
        const snapshot = await logsRef
            .where('timestamp', '<', cutoffDate)
            .limit(500)
            .get();
        const batch = admin.firestore().batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${snapshot.docs.length} old log entries`);
    }
    catch (error) {
        console.error('Failed to clean up old logs:', error);
    }
}
// Usage example:
/*
// In a Cloud Function:
export const myFunction = functions.https.onCall(async (data, context) => {
  const logger = createLogger('myFunction', context);
  
  logger.info('Processing request', { data });
  
  try {
    const result = await doSomething(data);
    logger.info('Request completed successfully', { result });
    return { success: true, data: result };
  } catch (error) {
    logger.error('Request failed', error);
    throw new functions.https.HttpsError('internal', 'An error occurred');
  }
});

// Or with the middleware:
export const myFunction = functions.https.onCall(
  withLogging('myFunction', async (logger, data, context) => {
    logger.info('Processing request', { data });
    const result = await doSomething(data);
    return { success: true, data: result };
  })
);
*/
//# sourceMappingURL=logger.js.map