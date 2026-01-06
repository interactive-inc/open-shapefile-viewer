import type { Feature, GeoJsonProperties } from "geojson";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeatureInfoPanelProps {
  feature: Feature | null;
}

export function FeatureInfoPanel({ feature }: FeatureInfoPanelProps) {
  if (!feature) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>属性情報</CardTitle>
          <CardDescription>
            ポリゴンをクリックすると属性情報が表示されます
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const properties = feature.properties as GeoJsonProperties;

  if (!properties || Object.keys(properties).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>属性情報</CardTitle>
          <CardDescription>属性情報がありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>属性情報</CardTitle>
        <CardDescription>
          {Object.keys(properties).length} 項目
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(properties).map(([key, value]) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium text-muted-foreground">
                    {key}
                  </td>
                  <td className="py-2 break-all">
                    {value !== null && value !== undefined
                      ? String(value)
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
