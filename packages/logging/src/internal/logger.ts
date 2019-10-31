import { collections } from '@salto/lowerdash'
import { Namespace, NamespaceOrModule, normalizeNamespaceOrModule } from './namespace'
import { LOG_LEVELS, LogLevel } from './level'
import { Config, mergeConfigs, NamespaceFilter, stringToNamespaceFilter } from './config'

export type LogMethod = (message: string | Error, ...args: unknown[]) => void

export type BaseLogger = {
  log(level: LogLevel, ...rest: Parameters<LogMethod>): ReturnType<LogMethod>
}

export type BaseLoggerMaker = (namespace: Namespace) => BaseLogger

export type BaseLoggerRepo = BaseLoggerMaker & {
  configure(config: Readonly<Config>): void
  end(): void // Note: there is currently no way to wait for a logger to end; see tests
}

// indexed type - needs a separate definition
type HasLoggerFuncs = {
  [level in LogLevel]: LogMethod
}

export type Logger = BaseLogger & HasLoggerFuncs & {
  readonly namespace: Namespace
}

type ResolvedConfig = Omit<Config, 'namespaceFilter'> & {
  namespaceFilter: NamespaceFilter
}

export const resolveConfig = (c: Config): ResolvedConfig => ({
  ...c,
  namespaceFilter: typeof c.namespaceFilter === 'string'
    ? stringToNamespaceFilter(c.namespaceFilter)
    : c.namespaceFilter as NamespaceFilter,
})

const addLogMethods = (logger: BaseLogger): Logger => Object.assign(
  logger,
  ...LOG_LEVELS.map(level => ({ [level]: logger.log.bind(logger, level) })),
)

export const logger = (
  baseLoggerRepo: BaseLoggerRepo,
  configGetter: () => ResolvedConfig,
  namespace: Namespace,
): Logger => {
  const baseLogger = baseLoggerRepo(namespace)
  const baseLog = baseLogger.log

  return addLogMethods(Object.assign(baseLogger, {
    namespace,
    log: (level: LogLevel, ...rest: Parameters<LogMethod>): void => {
      const { minLevel, namespaceFilter } = configGetter()
      if (minLevel === 'none' || !namespaceFilter(namespace)) {
        return
      }

      baseLog(level, ...rest)
    },
  }))
}

export type LoggerRepo = ((namespace: NamespaceOrModule) => Logger) & {
  configure(config: Readonly<Partial<Config>>): void
  readonly config: Readonly<Config>
  end(): void
}

export const loggerRepo = (
  baseLoggerRepo: BaseLoggerRepo,
  initialConfig: Readonly<Config>,
): LoggerRepo => {
  let config = Object.freeze(resolveConfig(initialConfig))

  const configGetter = (): ResolvedConfig => config

  const loggers = new collections.map.DefaultMap<Namespace, Logger>(
    namespace => logger(baseLoggerRepo, configGetter, namespace)
  )

  const getLogger = (
    namespace: NamespaceOrModule
  ): Logger => loggers.get(normalizeNamespaceOrModule(namespace))

  const result = Object.assign(getLogger, {
    configure(
      newConfig: Readonly<Partial<Config>>,
    ): void {
      config = Object.freeze(resolveConfig(mergeConfigs(config, newConfig)))
      baseLoggerRepo.configure(config)
    },
    end(): void { baseLoggerRepo.end() },
  })

  return Object.defineProperty(result, 'config', {
    get(): Readonly<Config> { return config },
  })
}