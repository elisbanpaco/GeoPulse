// Declaration for react-simple-maps (no official @types package)
declare module "react-simple-maps" {
  import { ReactNode, CSSProperties, MouseEventHandler } from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }
  export function ComposableMap(props: ComposableMapProps): JSX.Element;

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    children?: ReactNode;
  }
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;

  export interface GeographiesProps {
    geography: string | object;
    children: (data: { geographies: GeoFeature[] }) => ReactNode;
  }
  export function Geographies(props: GeographiesProps): JSX.Element;

  export interface GeoFeature {
    rsmKey: string;
    properties: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface GeographyStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    cursor?: string;
    opacity?: number;
    filter?: string;
    transition?: string;
  }

  export interface GeographyProps {
    key?: string;
    geography: GeoFeature;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    onClick?: MouseEventHandler<SVGPathElement>;
    style?: {
      default?: GeographyStyle;
      hover?: GeographyStyle;
      pressed?: GeographyStyle;
    };
  }
  export function Geography(props: GeographyProps): JSX.Element;
}
