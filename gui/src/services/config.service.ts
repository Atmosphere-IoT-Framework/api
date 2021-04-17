import HTTPService from './http.service';
import { IConfig } from '../common/models/config.model';
import Ajv from 'ajv';
import locale from "../common/locale";

const httpService: HTTPService = new HTTPService();

class ConfigService extends HTTPService {

  public async getRemoteConfig(url: string) {
    if (url.endsWith('.js')) {
      console.log("fetch config.js");
      return (await import(/* webpackIgnore: true */url)).configurator(locale);
    }
    return await httpService.fetch({
      origUrl: url,
    });
  }

  public async loadDefaultConfig() { return (await this.getRemoteConfig('../../config.js')); }

  public validateConfig(config: IConfig | null): { isValid: boolean, errorMessage: string | null } {
    if (config === null) {
      return {
        isValid: true,
        errorMessage: null,
      }
    }
    const configSchema = require('../assets/schemas/config.schema.json');
    const ajv = new Ajv({
      allErrors: true,
      verbose: true,
    });
    const validate = ajv.compile(configSchema);
    const isValid = validate(config);
    if (typeof isValid !== 'boolean') {
      throw new Error('Unexpected asynchronous JSON validation');
    }
    if (isValid) {
      return {
        isValid,
        errorMessage: null,
      }
    }
    const firstError = validate.errors ? validate.errors[0] : undefined;
    let errorMessage: string | null = null;
    if (firstError?.message && firstError?.dataPath) {
      errorMessage = `Error parsing configuration at "${firstError.dataPath}": ${firstError.message}`
    } else if (firstError?.message) {
      errorMessage = `Error parsing configuration: ${firstError.message}`
    } else if (firstError?.dataPath) {
      errorMessage = `Error parsing configuration at "${firstError.dataPath}"`
    } else {
      errorMessage = `Error parsing configuration`;
    }
    console.error(errorMessage);
    console.error('All configuration errors: ', validate.errors);
    return {
      isValid,
      errorMessage,
    };
  }

}

export default new ConfigService();
