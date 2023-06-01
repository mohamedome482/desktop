import React from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { useModule } from 'slap';
import { SourceSelectorModule } from './SourceSelector';

export function DualOutputSourceSelector(p: { nodeId: string; sceneId?: string }) {
  const { toggleVisibility } = useModule(SourceSelectorModule);
  const { DualOutputService, ScenesService } = Services;

  const horizontalNodeId = p.nodeId;

  const v = useVuex(() => ({
    verticalNodeId: DualOutputService.views.verticalNodeIds
      ? DualOutputService.views.activeSceneNodeMap[p.nodeId]
      : undefined,
    isHorizontalVisible: ScenesService.views.getNodeVisibility(p.nodeId, p?.sceneId),
    isVerticalVisible:
      !DualOutputService.views.isLoading && DualOutputService.views.hasVerticalNodes
        ? ScenesService.views.getNodeVisibility(
            DualOutputService.views.activeSceneNodeMap[p.nodeId],
            p?.sceneId,
          )
        : undefined,
    isLoading: DualOutputService.views.isLoading,
  }));

  return (
    <>
      <i
        onClick={() => toggleVisibility(horizontalNodeId)}
        className={v.isHorizontalVisible ? 'icon-desktop' : 'icon-desktop-hide'}
      />

      {!v?.isLoading && v?.verticalNodeId && (
        <i
          onClick={() => toggleVisibility(v.verticalNodeId)}
          className={v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide'}
        />
      )}
    </>
  );
}
