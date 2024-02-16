import styles from './GoLive.m.less';
import Scrollable from '../../shared/Scrollable';
import { Services } from '../../service-provider';
import React from 'react';
import { useGoLiveSettings } from './useGoLiveSettings';
import { DestinationSwitchers } from './DestinationSwitchers';
import { $t } from '../../../services/i18n';
import { Row, Col, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Section } from './Section';
import PlatformSettings from './PlatformSettings';
import OptimizedProfileSwitcher from './OptimizedProfileSwitcher';
import Spinner from '../../shared/Spinner';
import ButtonHighlighted from '../../shared/ButtonHighlighted';
import UltraIcon from '../../shared/UltraIcon';
import GoLiveError from './GoLiveError';
import TwitterInput from './Twitter';
import EmptyDestinations from './EmptyDestinations';
import { TPlatform, getPlatformService } from 'services/platforms';
import { ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import PlatformLogo from 'components-react/shared/PlatformLogo';

const PlusIcon = PlusOutlined as Function;

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function GoLiveSettings() {
  const {
    addDestination,
    isAdvancedMode,
    protectedModeEnabled,
    error,
    isLoading,
    canAddDestinations,
    shouldShowPrimeLabel,
    canUseOptimizedProfile,
    showTweet,
    hasDestinations,
    hasMultiplePlatforms,
    enabledPlatforms,
    primaryChat,
    setPrimaryChat,
  } = useGoLiveSettings().extend(module => {
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

      shouldShowPrimeLabel: !RestreamService.state.grandfathered && !UserService.views.isPrime,

      canUseOptimizedProfile:
        VideoEncodingOptimizationService.state.canSeeOptimizedProfile ||
        VideoEncodingOptimizationService.state.useOptimizedProfile,

      showTweet: UserService.views.auth?.primaryPlatform !== 'twitter',
    };
  });

  const shouldShowSettings = !error && !isLoading && hasDestinations;
  const shouldShowLeftCol = protectedModeEnabled;
  const shouldShowAddDestButton = canAddDestinations;
  const shouldShowPrimaryChatSwitcher = hasMultiplePlatforms && !isAdvancedMode;

  const primaryChatOptions = enabledPlatforms.map(platform => {
    const service = getPlatformService(platform);
    return {
      label: service.displayName,
      value: platform,
    };
  });

  const renderPrimaryChatOption = (option: { label: string; value: TPlatform }) => {
    /*
     * TODO: antd's new version has a new Flex component that should make
     * spacing (`gap` here) more consistent. Also, less typing.
     * https://ant.design/components/flex
     */
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <PlatformLogo platform={option.value} size={16} />
        <div>{option.label}</div>
      </div>
    );
  };

  return (
    <Row gutter={16} style={{ height: 'calc(100% + 24px)' }}>
      {/*LEFT COLUMN*/}
      {shouldShowLeftCol && (
        <Col span={8}>
          <Scrollable style={{ height: '81%' }} snapToWindowEdge>
            {/*DESTINATION SWITCHERS*/}
            <DestinationSwitchers />
            {/*ADD DESTINATION BUTTON*/}
            {shouldShowAddDestButton && (
              <a className={styles.addDestinationBtn} onClick={addDestination}>
                <PlusIcon style={{ paddingLeft: '17px', fontSize: '24px' }} />
                <span style={{ flex: 1 }}>{$t('Add Destination')}</span>
                {shouldShowPrimeLabel && (
                  <ButtonHighlighted filled text={$t('Ultra')} icon={<UltraIcon type="simple" />} />
                )}
              </a>
            )}
          </Scrollable>
          {shouldShowPrimaryChatSwitcher && (
            <div>
              <Divider style={{ marginBottom: '8px' }} />
              <Form layout="vertical">
                <ListInput
                  name="primaryChat"
                  label={$t('Primary Chat')}
                  options={primaryChatOptions}
                  labelRender={renderPrimaryChatOption}
                  optionRender={renderPrimaryChatOption}
                  value={primaryChat}
                  onChange={setPrimaryChat}
                />
              </Form>
            </div>
          )}
        </Col>
      )}

      {/*RIGHT COLUMN*/}
      <Col span={shouldShowLeftCol ? 16 : 24} style={{ height: '100%' }}>
        <Spinner visible={isLoading} relative />
        <GoLiveError />
        {!hasDestinations && <EmptyDestinations />}
        {shouldShowSettings && (
          <Scrollable style={{ height: '100%' }} snapToWindowEdge>
            {/*PLATFORM SETTINGS*/}
            <PlatformSettings />
            {/*ADD SOME SPACE IN ADVANCED MODE*/}
            {isAdvancedMode && <div className={styles.spacer} />}
            {/*EXTRAS*/}
            {hasDestinations && (
              <Section isSimpleMode={!isAdvancedMode} title={$t('Extras')}>
                {showTweet && <TwitterInput />}
                {!!canUseOptimizedProfile && <OptimizedProfileSwitcher />}
              </Section>
            )}
          </Scrollable>
        )}
      </Col>
    </Row>
  );
}
