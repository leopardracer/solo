// SPDX-License-Identifier: Apache-2.0

import {type ConfigBuilder} from '../api/config-builder.js';
import {type ConfigSource} from '../spi/config-source.js';
import {type Config} from '../api/config.js';
import {type ClassConstructor} from '../../../business/utils/class-constructor.type.js';
import {type Converter} from '../spi/converter.js';
import {EnvironmentConfigSource} from './environment-config-source.js';
import {type ObjectMapper} from '../../mapper/api/object-mapper.js';
import {LayeredConfig} from './layered-config.js';
import {type ConfigProvider} from '../api/config-provider.js';

export class LayeredConfigBuilder implements ConfigBuilder {
  private readonly sources: ConfigSource[];
  private readonly converters: ConverterEntry[];
  private mergeSourceValues: boolean = false;

  public constructor(
    private provider: ConfigProvider,
    private readonly mapper: ObjectMapper,
    private readonly prefix?: string,
  ) {
    this.sources = [];
    this.converters = [];
  }

  public withDefaultSources(): ConfigBuilder {
    this.sources.push(new EnvironmentConfigSource(this.mapper, this.prefix));
    return this;
  }

  public withConverter<R extends object>(
    cls: ClassConstructor<R>,
    priority: number,
    converter: Converter<R>,
  ): ConfigBuilder {
    this.converters.push(new ConverterEntry(cls, priority, converter));
    return this;
  }

  public withDefaultConverters(): ConfigBuilder {
    return this;
  }

  public withSources(...sources: ConfigSource[]): ConfigBuilder {
    this.sources.push(...sources);
    return this;
  }

  public withMergeSourceValues(mergeSourceValues: boolean): ConfigBuilder {
    this.mergeSourceValues = mergeSourceValues;
    return this;
  }

  public build(): Config {
    const cfg: Config = new LayeredConfig(this.sources, this.mergeSourceValues);
    this.provider.register(cfg);
    return cfg;
  }
}

class ConverterEntry {
  public constructor(
    public readonly ctor: ClassConstructor<object>,
    public readonly priority: number,
    public readonly converter: Converter<object>,
  ) {}
}
