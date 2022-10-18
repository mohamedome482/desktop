import { Inject, mutation, StatefulService, ViewHandler } from 'services/core';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';
import { VideoSettingsService } from './video';
import { $t } from 'services/i18n';
import { OutputsService } from './output';

interface IAdvancedSettingsState {
  delay: obs.IDelay;
  reconnect: obs.IReconnect;
}

class AdvancedSettingsViews extends ViewHandler<IAdvancedSettingsState> {
  advancedSettingsValues(category: string) {
    return this.state[category];
  }
}

export class AdvancedSettingsService extends StatefulService<IAdvancedSettingsState> {
  @Inject() videoSettingsService: VideoSettingsService;
  @Inject() settingsManagerService: SettingsManagerService;
  @Inject() outputsService: OutputsService;

  initialState = {
    delay: obs.DelayFactory.create(),
    reconnect: obs.ReconnectFactory.create(),
  };

  init() {
    this.establishState();
  }

  get views() {
    return new AdvancedSettingsViews(this.state);
  }

  get videoSettingsMetadata() {
    return {
      outputFormat: {
        type: 'list',
        label: $t('Color Format'),
        options: [
          { label: 'NV12', value: obs.EVideoFormat.NV12 },
          { label: 'I420', value: obs.EVideoFormat.I420 },
          { label: 'I444', value: obs.EVideoFormat.I444 },
          { label: 'RGB', value: obs.EVideoFormat.RGBA },
        ],
      },
      colorSpace: {
        type: 'list',
        label: $t('YUV Color Space'),
        options: [
          { label: '601', value: obs.EColorSpace.CS601 },
          { label: '709', value: obs.EColorSpace.CS709 },
        ],
      },
      range: {
        type: 'list',
        label: $t('YUV Color Range'),
        options: [
          { label: $t('Partial'), value: obs.ERangeType.Partial },
          { label: $t('Full'), value: obs.ERangeType.Full },
        ],
      },
    };
  }

  get videoSettingsValues() {
    return this.videoSettingsService.advancedSettingsValues;
  }

  get delaySettingsMetadata() {
    return {
      enabled: { type: 'toggle', label: $t('Enabled') },
      delaySec: { type: 'number', label: $t('Duration (seconds)') },
      preserveDelay: {
        type: 'checkbox',
        label: $t('Preserve cutoff point (increase delay) when reconnecting'),
      },
    };
  }

  get reconnectSettingsMetadata() {
    return {
      enabled: { type: 'toggle', label: $t('Enabled') },
      retryDelay: { type: 'number', label: $t('Retry Delay (seconds') },
      maxRetries: { type: 'number', label: $t('Maximum Retries') },
    };
  }

  establishState() {
    this.migrateSettings();

    this.linkSettings();
  }

  migrateSettings() {
    const delay = this.settingsManagerService.simpleStreamSettings.delay;
    Object.keys(delay).forEach((key: string) => {
      this.SET_ADVANCED_SETTING('delay', key, delay[key]);
    });
    const reconnect = this.settingsManagerService.simpleStreamSettings.reconnect;
    Object.keys(reconnect).forEach((key: string) => {
      this.SET_ADVANCED_SETTING('reconnect', key, reconnect[key]);
    });
  }

  linkSettings() {
    this.outputsService.streamSettings.delay = this.state.delay;
    this.outputsService.streamSettings.reconnect = this.state.reconnect;
  }

  setVideoSetting(key: string, value: unknown) {
    this.videoSettingsService.setVideoSetting(key, value);
  }

  setAdvancedSetting(category: string, key: string, value: unknown) {
    this.SET_ADVANCED_SETTING(category, key, value);
  }

  @mutation()
  SET_ADVANCED_SETTING(category: string, key: string, value: unknown) {
    this.state[category][key] = value;
  }
}