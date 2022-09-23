import React, { useState } from 'react';
// import Animation from 'rc-animate';
// import cx from 'classnames';
import { TAppPage } from 'services/navigation';
import { EAvailableFeatures } from 'services/incremental-rollout';
// import { $t } from 'services/i18n';
// import { getPlatformService } from 'services/platforms';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import AppsNav from './AppsNav';
import NavTools from './NavTools';
// import styles from './SideNav.m.less';
import { Menu, Layout } from 'antd';
import { SideBarTopNavData, IMenuItem, IParentMenuItem } from 'services/layout/side-nav';
// import { has } from 'lodash';

const { Sider } = Layout;

export default function SideNav() {
  const {
    AppService,
    CustomizationService,
    NavigationService,
    UserService,
    PlatformAppsService,
    IncrementalRolloutService,
    UsageStatisticsService,
  } = Services;

  const menuOptions = SideBarTopNavData();

  function navigate(page: TAppPage, trackingTarget?: string) {
    if (!UserService.views.isLoggedIn && page !== 'Studio') return;

    if (trackingTarget) {
      UsageStatisticsService.actions.recordClick('SideNav', trackingTarget);
    }
    NavigationService.actions.navigate(page);
  }

  const {
    featureIsEnabled,
    // appStoreVisible,
    // currentPage,
    // leftDock,
    enabledApps,
    loggedIn,
  } = useVuex(() => ({
    featureIsEnabled: (feature: EAvailableFeatures) =>
      IncrementalRolloutService.views.featureIsEnabled(feature),
    currentPage: NavigationService.state.currentPage,
    leftDock: CustomizationService.state.leftDock,
    appStoreVisible: UserService.views.isLoggedIn && PlatformAppsService.state.storeVisible,
    loading: AppService.state.loading,
    enabledApps: PlatformAppsService.views.enabledApps,
    loggedIn: UserService.views.isLoggedIn,
  }));

  /*
   * TODO: Create logic for legacy menu to show themes as primary items
   */
  // const hasThemes =
  //   loggedIn &&
  //   UserService.views.platform?.type &&
  //   getPlatformService(UserService.views.platform.type).hasCapability('themes');

  /*
   * WIP: logic for side bar nav.
   * TODO: Create logic for legacy menu. If the user is newly created, they will not see certain menu options.
   */
  const hasLegacyMenu = true;
  const [open, setOpen] = useState(false);

  /*
   * Theme audit will only ever be enabled on individual accounts or enabled
   * via command line flag. Not for general use.
   */
  const themeAuditEnabled = featureIsEnabled(EAvailableFeatures.themeAudit);

  return (
    <Layout
      hasSider
      style={{
        width: '100%',
        minHeight: '100vh',
      }}
    >
      <Sider
        collapsible
        collapsed={!open}
        onCollapse={() => setOpen(!open)}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        {/* TODO: Apply styles */}
        {/* <div className={cx('side-nav', styles.container, { [styles.leftDock]: leftDock })}> */}
        <Menu forceSubMenuRender mode="inline">
          {menuOptions.menuItems.map((menuItem: IParentMenuItem) => {
            if (
              (menuItem.isLegacy && !hasLegacyMenu) ||
              (!loggedIn && menuItem.title === 'Alert Box')
            ) {
              // skip legacy menu items for new users
              // skip alert box library for users that are not logged in
              return null;
            }
            return menuItem.hasOwnProperty('subMenuItems') ||
              (themeAuditEnabled && menuItem.title !== 'Theme Audit') ? (
              <Menu.SubMenu
                key={menuItem?.target ?? menuItem?.trackingTarget}
                title={`${menuItem.title}`}
                icon={menuItem?.icon && <i className={menuItem.icon} />}
                onTitleClick={() =>
                  (menuItem.hasOwnProperty('isToggled') && console.log('Toggle studio mode')) ||
                  (menuItem?.target &&
                    navigate(menuItem.target as TAppPage, menuItem?.trackingTarget))
                }
              >
                {menuItem?.subMenuItems?.map((subMenuItem: IMenuItem) => (
                  <Menu.Item
                    key={subMenuItem?.target ?? subMenuItem?.trackingTarget}
                    title={subMenuItem.title}
                    onClick={() =>
                      menuItem?.target
                        ? navigate(menuItem?.target as TAppPage, menuItem?.trackingTarget)
                        : console.log('target tbd')
                    }
                    // TODO: Update onclick after all targets confirmed
                  >
                    {subMenuItem.title}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            ) : (
              <Menu.Item
                key={menuItem?.target ?? menuItem?.trackingTarget}
                title={`${menuItem.title}`}
                icon={menuItem?.icon && <i className={menuItem.icon} />}
              >
                {menuItem.title}
              </Menu.Item>
            );
          })}
          <Menu.Item>
            {/* TODO: Convert AppsNav to antd menu items */}
            {enabledApps.length > 0 && hasLegacyMenu && <AppsNav />}
          </Menu.Item>
        </Menu>

        <NavTools />
      </Sider>
    </Layout>
  );
}

// function StudioTab(p: {
//   page: { target: string; title: string; icon: string; trackingTarget: string };
//   navigate: (page: TAppPage, trackingTarget?: string) => void;
// }) {
//   const { LayoutService, NavigationService } = Services;
//   const { currentPage } = useVuex(() => ({
//     currentPage: NavigationService.state.currentPage,
//   }));

//   function navigateToStudioTab(tabId: string, trackingTarget: string) {
//     p.navigate('Studio', trackingTarget);
//     LayoutService.actions.setCurrentTab(tabId);
//   }

//   return (
//     <div
//       className={cx(styles.mainCell, {
//         [styles.active]:
//           currentPage === 'Studio' && LayoutService.state.currentTab === p.page.target,
//       })}
//       onClick={() => navigateToStudioTab(p.page.target, p.page.trackingTarget)}
//       title={p.page.title}
//     >
//       <i className={p.page.icon} />
//     </div>
//   );
// }

// function PrimaryStudioTab(p: { currentPage: string; navigate: (page: TAppPage) => void }) {
//   const [showTabDropdown, setShowTabDropdown] = useState(false);
//   const { LayoutService } = Services;
//   const { currentTab, tabs } = useVuex(() => ({
//     currentTab: LayoutService.state.currentTab,
//     tabs: LayoutService.state.tabs,
//   }));

//   const studioTabs = Object.keys(tabs).map((tab, i) => ({
//     target: tab,
//     title: i === 0 || !tabs[tab].name ? $t('Editor') : tabs[tab].name,
//     icon: tabs[tab].icon,
//     trackingTarget: tab === 'default' ? 'editor' : 'custom',
//   }));

//   return (
//     <div
//       onMouseEnter={() => setShowTabDropdown(true)}
//       onMouseLeave={() => setShowTabDropdown(false)}
//     >
//       <div
//         className={cx(styles.primaryTab, {
//           [styles.active]: p.currentPage === 'Studio' && currentTab === 'default',
//         })}
//       >
//         <StudioTab page={studioTabs[0]} navigate={p.navigate} />
//         {studioTabs.length > 1 && (
//           <i
//             className={cx('icon-down', styles.studioDropdown, {
//               [styles.studioDropdownActive]: currentTab !== 'default',
//             })}
//           />
//         )}
//       </div>
//       <Animation transitionName="ant-slide-up">
//         {showTabDropdown && (
//           <div className={styles.studioTabs}>
//             {studioTabs.slice(1).map(page => (
//               <StudioTab page={page} navigate={p.navigate} key={page.target} />
//             ))}
//           </div>
//         )}
//       </Animation>
//     </div>
//   );
// }
