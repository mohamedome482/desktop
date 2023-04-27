import React from 'react';
import styles from './DualOutputGoLive.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { DualOutputDestinationSwitcher } from './DualOutputDestinationSwitchers';
import { $t } from 'services/i18n';
import { Row, Col } from 'antd';
import { Section } from '../Section';
import PlatformSettings from '../PlatformSettings';
import TwitterInput from '../Twitter';
import OptimizedProfileSwitcher from '../OptimizedProfileSwitcher';
import Spinner from 'components-react/shared/Spinner';
import GoLiveError from '../GoLiveError';
import DualOutputDestinationButton from './DualOutputDestinationButton';

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function DualOutputGoLiveSettings() {
  const { isAdvancedMode, isLoading, canUseOptimizedProfile } = useGoLiveSettings().extend(
    module => {
      const {
        RestreamService,
        SettingsService,
        UserService,
        MagicLinkService,
        VideoEncodingOptimizationService,
      } = Services;

      return {
        get canAddDestinations() {
          const linkedPlatforms = module.state.linkedPlatforms;
          const customDestinations = module.state.customDestinations;
          return linkedPlatforms.length + customDestinations.length < 5;
        },

        addDestination() {
          // open the stream settings or prime page
          if (UserService.views.isPrime) {
            SettingsService.actions.showSettings('Stream');
          } else {
            MagicLinkService.linkToPrime('slobs-multistream');
          }
        },

        shouldShowPrimeLabel: !RestreamService.state.grandfathered,

        canUseOptimizedProfile:
          VideoEncodingOptimizationService.state.canSeeOptimizedProfile ||
          VideoEncodingOptimizationService.state.useOptimizedProfile,
      };
    },
  );

  return (
    <Row gutter={16} className={styles.settingsRow}>
      {/*LEFT COLUMN*/}
      <Col span={8} className={styles.leftColumn}>
        <Scrollable style={{ height: '100%' }}>
          {/*DESTINATION SWITCHERS*/}
          <DualOutputDestinationSwitcher />
          {/*ADD DESTINATION BUTTON*/}
          <DualOutputDestinationButton />
        </Scrollable>
      </Col>

      {/*RIGHT COLUMN*/}
      <Col span={16} className={styles.rightColumn}>
        <Spinner visible={isLoading} />
        <GoLiveError />
        <Scrollable style={{ height: '100%' }} snapToWindowEdge>
          {/*PLATFORM SETTINGS*/}
          <PlatformSettings />
          {/*ADD SOME SPACE IN ADVANCED MODE*/}
          {isAdvancedMode && <div className={styles.spacer} />}
          {/*EXTRAS*/}
          <Section isSimpleMode={!isAdvancedMode} title={$t('Extras')}>
            <TwitterInput />
            {!!canUseOptimizedProfile && <OptimizedProfileSwitcher />}
          </Section>
        </Scrollable>
      </Col>
    </Row>
  );
}
