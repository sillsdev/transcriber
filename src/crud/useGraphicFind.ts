import { InitializedRecord } from '@orbit/records';
import { apmGraphic } from '../components/GraphicUploader';
import { useOrbitData } from '../hoc/useOrbitData';
import { ArtifactCategoryD, GraphicD } from '../model';

export const useGraphicFind = () => {
  const graphics = useOrbitData('graphic') as GraphicD[];
  const artifactCategory = useOrbitData(
    'artifactcategory'
  ) as ArtifactCategoryD[];

  return (recId: InitializedRecord, ref?: string) => {
    let graphicRec = graphics.find(
      (g) =>
        g.attributes.resourceType === recId.type &&
        g.attributes.resourceId === parseInt(recId?.keys?.remoteId ?? '0')
    );
    let color = undefined;
    if (ref) {
      const catText = ref.split(' ')[1];
      const catRec = artifactCategory.find(
        (c) => c.attributes.categoryname === catText
      );
      if (catRec) {
        color = catRec.attributes.color;
        if (!graphicRec) {
          graphicRec = graphics.find(
            (g) =>
              g.attributes.resourceType === 'category' &&
              g.attributes.resourceId ===
                parseInt(catRec?.keys?.remoteId ?? '0')
          );
        }
      }
    }
    if (graphicRec) {
      var gr = apmGraphic(graphicRec);
      return { uri: gr?.graphicUri, rights: gr?.graphicRights, color };
    }
    return { uri: undefined, rights: undefined, color };
  };
};
