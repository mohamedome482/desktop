import React, { useMemo, useState } from 'react';
import cx from 'classnames';
import electron from 'electron';
import Utils from 'services/utils';
import { $t } from 'services/i18n';
import throttle from 'lodash/throttle';
import { Services } from '../service-provider';
import { useVuex } from '../hooks';
import styles from './NavTools.m.less';
import * as remote from '@electron/remote';
import { Badge, Button, Form, Menu, Modal } from 'antd';
import { EMenuItemKey, ENavName, IMenuItem, IParentMenuItem, menuTitles } from 'services/side-nav';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import SubMenu from 'components-react/shared/SubMenu';
import MenuItem from 'components-react/shared/MenuItem';
import UltraIcon from 'components-react/shared/UltraIcon';
import PlatformIndicator from './PlatformIndicator';

export default function SideNav() {
  const {
    UserService,
    SettingsService,
    MagicLinkService,
    UsageStatisticsService,
    SideNavService,
    WindowsService,
  } = Services;

  const isDevMode = Utils.isDevMode();

  const {
    isLoggedIn,
    isPrime,
    menuItems,
    isOpen,
    openMenuItems,
    expandMenuItem,
    updateStyleBlockers,
  } = useVuex(
    () => ({
      isLoggedIn: UserService.views.isLoggedIn,
      isPrime: UserService.views.isPrime,
      menuItems: SideNavService.views.state[ENavName.BottomNav].menuItems,
      isOpen: SideNavService.views.isOpen,
      openMenuItems: SideNavService.views.getExpandedMenuItems(ENavName.BottomNav),
      expandMenuItem: SideNavService.actions.expandMenuItem,
      updateStyleBlockers: WindowsService.actions.updateStyleBlockers,
    }),
    false,
  );

  const [dashboardOpening, setDashboardOpening] = useState(false);
  const [showModal, setShowModal] = useState(false);

  function openSettingsWindow(type?: string, category?: string) {
    UsageStatisticsService.actions.recordClick('SideNav2', type ?? 'settings');
    SettingsService.actions.showSettings(category);
  }

  function openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  async function openDashboard(page?: string) {
    UsageStatisticsService.actions.recordClick('SideNav2', page || 'dashboard');
    if (dashboardOpening) return;
    setDashboardOpening(true);

    try {
      const link = await MagicLinkService.getDashboardMagicLink(page);
      remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }

    setDashboardOpening(false);
  }

  const throttledOpenDashboard = throttle(openDashboard, 2000, { trailing: false });

  function openHelp() {
    UsageStatisticsService.actions.recordClick('SideNav2', 'help');
    remote.shell.openExternal(
      'https://streamlabs.com/content-hub/support/support-streamlabs-desktop',
    );
  }

  async function upgradeToPrime() {
    UsageStatisticsService.actions.recordClick('SideNav2', 'prime');
    MagicLinkService.linkToPrime('slobs-side-nav');
  }

  const handleAuth = () => {
    if (isLoggedIn) {
      UserService.actions.logOut();
    } else {
      WindowsService.actions.closeChildWindow();
      UserService.actions.showLogin();
    }
  };

  const handleShowModal = (status: boolean) => {
    updateStyleBlockers('main', status);
    setShowModal(status);
  };

  return (
    <>
      <Menu
        key={ENavName.BottomNav}
        forceSubMenuRender
        mode="inline"
        className={cx(styles.bottomNav, !isOpen && styles.closed, isOpen && styles.open)}
        defaultOpenKeys={openMenuItems && openMenuItems}
        getPopupContainer={triggerNode => triggerNode}
      >
        {menuItems.map((menuItem: IParentMenuItem) => {
          if (isDevMode && menuItem.key === EMenuItemKey.DevTools) {
            return <NavToolsItem key={menuItem.key} menuItem={menuItem} onClick={openDevTools} />;
          } else if (!isPrime && menuItem.key === EMenuItemKey.GetPrime) {
            return (
              <NavToolsItem
                key={menuItem.key}
                menuItem={menuItem}
                icon={
                  <div>
                    <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
                      <UltraIcon />
                    </Badge>
                  </div>
                }
                onClick={upgradeToPrime}
                className={styles.badgeScale}
              />
            );
          } else if (isLoggedIn && menuItem.key === EMenuItemKey.Dashboard) {
            return (
              <SubMenu
                key={menuItem.key}
                title={menuTitles(menuItem.key)}
                icon={
                  <div>
                    <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
                      <i className={cx(menuItem.icon, 'small')} />
                    </Badge>
                  </div>
                }
                onTitleClick={() => {
                  !isOpen && throttledOpenDashboard();
                  expandMenuItem(ENavName.BottomNav, menuItem.key as EMenuItemKey);
                }}
              >
                <DashboardSubMenu
                  subMenuItems={menuItem?.subMenuItems}
                  throttledOpenDashboard={throttledOpenDashboard}
                  openSettingsWindow={openSettingsWindow}
                />
              </SubMenu>
            );
          } else if (menuItem.key === EMenuItemKey.GetHelp) {
            return (
              <NavToolsItem
                key={menuItem.key}
                menuItem={menuItem}
                icon={
                  <div>
                    <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
                      <i className={menuItem?.icon} />
                    </Badge>
                  </div>
                }
                onClick={() => openHelp()}
              />
            );
          } else if (menuItem.key === EMenuItemKey.Settings) {
            return (
              <NavToolsItem
                key={menuItem.key}
                menuItem={menuItem}
                onClick={() => openSettingsWindow()}
              />
            );
          } else if (menuItem.key === EMenuItemKey.Login) {
            return (
              <LoginMenuItem
                key={menuItem.key}
                menuItem={menuItem}
                handleAuth={handleAuth}
                handleShowModal={handleShowModal}
              />
            );
          }
        })}
      </Menu>
      <LogoutModal
        showModal={showModal}
        handleAuth={handleAuth}
        handleShowModal={handleShowModal}
        username={UserService.username}
      />
    </>
  );
}

function NavToolsItem(p: {
  menuItem: IMenuItem;
  icon?: React.ReactElement;
  className?: string;
  onClick: () => void;
}) {
  const { menuItem, icon, className, onClick } = p;
  const title = useMemo(() => {
    return menuTitles(menuItem.key);
  }, [menuItem]);
  return (
    <MenuItem
      title={title}
      icon={icon ?? <i className={menuItem?.icon} />}
      className={className}
      onClick={onClick}
    >
      {title}
    </MenuItem>
  );
}

function DashboardSubMenu(p: {
  subMenuItems: IMenuItem[];
  throttledOpenDashboard: (type?: string) => void;
  openSettingsWindow: (type: string, category: string) => void;
}) {
  const { subMenuItems, throttledOpenDashboard, openSettingsWindow } = p;

  function handleNavigation(type?: string) {
    if (type === 'multistream') {
      openSettingsWindow(type, 'Multistreaming');
    } else {
      throttledOpenDashboard(type);
    }
  }
  return (
    <>
      {subMenuItems.map((subMenuItem: IMenuItem) => (
        <MenuItem
          key={subMenuItem.key}
          title={menuTitles(subMenuItem.key)}
          onClick={() => handleNavigation(subMenuItem?.type)}
        >
          {menuTitles(subMenuItem.key)}
        </MenuItem>
      ))}
    </>
  );
}

function LogoutModal(p: {
  showModal: boolean;
  handleAuth: () => void;
  handleShowModal: (status: boolean) => void;
  username?: string;
}) {
  return (
    <Modal
      footer={null}
      visible={p.showModal}
      onCancel={() => p.handleShowModal(false)}
      getContainer={false}
      className={styles.confirmLogout}
    >
      <Form className={styles.confirmLogout}>
        <h2>{$t('Confirm')}</h2>
        {$t('Are you sure you want to log out %{username}?', {
          username: p.username,
        })}
        <div className={styles.buttons}>
          <Button onClick={() => p.handleAuth()}>{$t('Yes')}</Button>
          <Button onClick={() => p.handleShowModal(false)}>{$t('No')}</Button>
        </div>
      </Form>
    </Modal>
  );
}

function LoginMenuItem(p: {
  menuItem: IMenuItem;
  handleAuth: () => void;
  handleShowModal: (status: boolean) => void;
}) {
  const { menuItem, handleAuth, handleShowModal } = p;
  const { UserService, SideNavService } = Services;

  const { isLoggedIn, platform, isOpen } = useVuex(
    () => ({
      isLoggedIn: UserService.views.isLoggedIn,
      platform: UserService.views.auth?.platforms[UserService.views.auth?.primaryPlatform],
      isOpen: SideNavService.views.isOpen,
    }),
    false,
  );

  return (
    <MenuItem
      title={!isLoggedIn ? menuTitles(menuItem.key) : $t('Log Out')}
      className={cx(styles.login, !isOpen && styles.loginClosed)}
      icon={!isOpen && <i className="icon-user" />}
      onClick={() => (isLoggedIn ? handleShowModal(true) : handleAuth())}
    >
      {!isLoggedIn ? (
        <span className={styles.loggedOut}>{menuTitles(menuItem.key)}</span>
      ) : (
        isOpen && <PlatformIndicator platform={platform} />
      )}
    </MenuItem>
  );
}
