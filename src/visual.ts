/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
"use strict";

import "./../style/visual.less";

import "core-js/stable";
import "regenerator-runtime/runtime";

// d3
import * as d3 from "d3";

import { event as d3Event, select as d3Select } from "d3-selection";

// powerbi
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

import DataViewValueColumns = powerbi.DataViewValueColumns;

// powerbi.extensibility
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;

// powerbi.extensibility.visual
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

// powerbi.extensibility.utils.dataview
import { dataRoleHelper as DataRoleHelperModule } from "powerbi-visuals-utils-dataviewutils";

import DataRoleHelper = DataRoleHelperModule.DataRoleHelper;

// powerbi.extensibility.utils.svg
import { manipulation, IMargin, CssConstants } from "powerbi-visuals-utils-svgutils";
import translate = manipulation.translate;
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;
import translateAndRotate = manipulation.translateAndRotate;

// powerbi.extensibility.utils.chart
import { dataLabelUtils } from "powerbi-visuals-utils-chartutils";

// powerbi.extensibility.utils.formatting
import { valueFormatter, textMeasurementService, displayUnitSystemType, interfaces as FormattingUtilsInterfaces } from "powerbi-visuals-utils-formattingutils";
import DisplayUnitSystemType = displayUnitSystemType.DisplayUnitSystemType;
import IValueFormatter = valueFormatter.IValueFormatter;
import ValueFormatterOptions = valueFormatter.ValueFormatterOptions;
import TextProperties = FormattingUtilsInterfaces.TextProperties;

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

import { TooltipEnabledDataPoint } from "powerbi-visuals-utils-tooltiputils";

import { LabelLayoutStrategy } from "powerbi-visuals-utils-chartutils/lib/axis/axis";

import { AxisScaleType, PercentType, AxisVisualSettings, RangeVisualSettings, TargetVisualSettings, IndicatorVisualSettings, LabelsVisualSettings, CalloutValueVisualSettings, CalloutPercentVisualSettings, MarginVisualSettings, VisualSettings, ColorScheme, RangeDefaultSettings } from "./settings";

import { TachometerUtilities } from "./utilities";

const minLabelFontSize: number = 8;

export interface Offset {
    x: number;
    y: number;
}

export interface TargetDetails {
    centerX: number;
    centerY: number;
    tipX: number;
    tipY: number;
    defaultTextAnchorX: number;
    defaultTextAnchorY: number;
    gaugeRadius: number;
    labelRadius: number;
    onRightSide: boolean;
    onTopHalf: boolean;
    targetAngle: number;
}

export interface TachometerDataLabelsData {
    show: boolean;
    fontSizePx?: string;
    labelColor?: string;
    displayUnits?: number;
    precision?: number;
    fontSize?: number;
    round?: boolean;
    count?: number;
    reduce?: boolean;
    offset?: Offset;
    formatter?: IValueFormatter;
    textHeight?: number;
    invert?: boolean;
    // Where percent value is measured against
    percentType?: PercentType;
    // Formatted string value of the label
    formattedValue?: string;
    // Width of formatted text
    textWidth?: number;
}

export interface TachometerViewModel extends TooltipEnabledDataPoint {
    viewportHeight: number;
    viewportWidth: number;
    availableHeight: number;
    availableWidth: number;
    axis: TachometerAxisData;
    callout: TachometerCalloutSettings;

    settings: VisualSettings;
}

export interface TachometerIndicatorData {
    value: number;
    pointerColor: string;
    // Ratio of distance to Pointer tip as a factor of radius
    pointerSizeFactor: number;
    needletransformString: string;
    needlePoints: { x: number; y: number }[];
    // Inner Radius of the base as a ratio of its outer radius
    baseThicknessFactor: number;
    baseRadius: number;
    baseInnerRadius: number;
    baseStartAngle: number;
    baseEndtAngle: number;
    baseColor: string;
}

export interface TachometerCalloutSettings {
    calloutValue: TachometerDataLabelsData;
    calloutPercent: TachometerDataLabelsData;
    baseOffset: Offset;
}

export interface TachometerTranslationSettings {
    radius: number;
    startAngle: number;
    endAngle: number;
    xOffset: number;
    yOffset: number;
    calloutxOffset: number;
    calloutyOffset: number;
}

export interface TachometerAxisData extends TooltipEnabledDataPoint {
    show: boolean;
    value: number;
    percent: number;
    // The angle to start the dial
    startAngle: number;
    // The angle to end the dial
    endAngle: number;
    // Scale to measure data in the gauge
    axisScaleType: AxisScaleType;
    // The start value of the dial
    startValue: number;
    // The end value of the dial
    endValue: number;
    range1: TachometerRangeData;
    range2: TachometerRangeData;
    range3: TachometerRangeData;
    range4: TachometerRangeData;
    range5: TachometerRangeData;
    range6: TachometerRangeData;
    range7: TachometerRangeData;
    target: TachometerTargetData;
    dataLabels: TachometerDataLabelsData;
    offset: Offset;
    transformString: string;
    indicator: TachometerIndicatorData;
    // Range between startValue and endValue
    valueRange: number;
    // Angle between startAngle and endAngle
    angleRange: number;
    radius: number;
    axisLabelRadius: number;
    directionClockwise: boolean;
    // Quadrant where start angle is
    startQuadrant: number;
    // Quadrant where end angle is
    endQuadrant: number;
    // cos value of startAngle
    cosStartAngle: number;
    // cos value of EndAngle
    cosEndAngle: number;
    // sin value of startAngle
    sinStartAngle: number;
    // sin value of EndAngle
    sinEndAngle: number;
}

interface TachometerStyle {
    indicator: {
        thickness: number;
        fill: string;
    };
    targetLine: {
        thickness: number;
    };
    labels: {
        padding: number;
    };
    callout: {
        padding: number;
    };
    target: {
        padding: number;
    };
}

export interface TachometerSmallViewPortProperties {
    hideTachometerSideNumbersOnSmallViewPort: boolean;
    smallTachometerMarginsOnSmallViewPort: boolean;
    MinHeightTachometerSideNumbersVisible: number;
    TachometerMarginsOnSmallViewPort: number;
}

export interface TachometerRectangle {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface TachometerAxisLabel {
    show: boolean;
    angle: number;
    value: number;
    displayValue: string;
    anchor: string;
    xOffset: number;
    yOffset: number;
    textWidth: number;
    textHeight: number;
    // Redundat data for performance
    rect: TachometerRectangle;
    // Link to the graphics element
    graphicsElement: d3.Selection<d3.BaseType, any, any, any>;
}

export interface TachometerRangeSettings {
    startValue: number;
    rangeColor: string;
    // Size of inner Radius as a factor of Radius
    innerRadiusRatio: number;
}

export interface TachometerRangeData extends TachometerRangeSettings {
    radius: number;
    innerRadius: number;
    startAngle: number;
    endAngle: number;
    endValue: number;
}

export interface TachometerTargetData {
    show: boolean;
    value: number;
    lineColor: string;
    // Size of inner Radius as a factor of Radius
    innerRadiusRatio: number;
    radius: number;
    innerRadius: number;
    thickness: number;
    offset: Offset;
    textColor: string;
    fontSize: number;
    fontSizePx?: string;
    textHeight?: number;
    // Formatted string value of the label
    formattedValue?: string;
    // Width of formatted text
    textWidth?: number;
}

export interface TachometerRoleNames {
    y: string;
    startValue: string;
    endValue: string;
    targetValue: string;
    range2StartValue: string;
    range3StartValue: string;
    range4StartValue: string;
    range5StartValue: string;
    range6StartValue: string;
    range7StartValue: string;
    displayFilter: string;
}

export interface Margins {
    mainMargin: IMargin;
    labelMargin: IMargin;
    targetMargin: IMargin;
}

export interface PruningLimit {
    width: number;
    height: number;
}

/**
 * Renders a data value in a gauge. The gauge can start and end in any user defined angle/orientation.
 * Gauge has 3 main regions to indicate for example fail, average, high values.
 * Almost every component in the gauge is customizable.
 * Indika Chamara Ranasinghe 6/21/2016
 * Updated to CLI API 1/31/2017
 */
export class Tachometer implements IVisual {
    private static UninitializedStartValue = -Infinity;
    private static UninitializedEndValue = +Infinity;

    // Uninitialize to UninitializedEndValue so that the range is invalid
    private static UnintializedRangeStartValue = Tachometer.UninitializedEndValue;
    private static UninitializedRatio = +Infinity;
    private static UnintializedStartAngle = -Math.PI * 2 / 3;
    private static UnintializedEndAngle = Math.PI * 2 / 3;
    private static PiBy4 = Math.PI / 4;
    private static ThreePiBy4 = Math.PI * 3 / 4;
    private static MinusPiBy4 = - Math.PI / 4;
    private static MinusThreePiBy4 = - Math.PI * 3 / 4;

    private static MinWidthForAxisLabel = 150;
    private static MinHeightForAxisLabel = 150;
    private static MinWidthForTargetLabel = 150;
    private static MinHeightForTargetLabel = 150;
    private static MinWidthForCalloutLabel = 125;
    private static MinHeightForCalloutLabel = 120;
    private static MinWidthForCalloutPercentLabel = 140;
    private static MinHeightForCalloutPercentLabel = 130;
    private static ReducedHorizontalMargin = 5;

    // Used for logic
    private static UnitMargin = 5;
    private static MaxMarginSize = 20;

    public static DefaultMarginSettings: IMargin = {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
    };

    private static DefaultMax = 1;
    private static DefaultMin = 0;
    private static VisualClassName = "tachometer";
    private static DefaultLabelCount = 4;
    private static MinLabelDistance = 50;

    private static DefaultStyleProperties: TachometerStyle = {
        indicator: {
            thickness: 2,
            fill: 'none'
        },
        targetLine: {
            thickness: 2
        },
        labels: {
            padding: 10,
        },
        callout: {
            padding: 10,
        },
        target: {
            padding: 10,
        }
    };

    // Red/Green/Red Color Scheme
    public static DefaultRange1ColorSchemeRgr = '#EA4335';   // Red
    public static DefaultRange2ColorSchemeRgr = '#FB9B05';   // Orange
    public static DefaultRange3ColorSchemeRgr = '#FBBC05';   // Yellow
    public static DefaultRange4ColorSchemeRgr = '#34A853';   // Green
    public static DefaultRange5ColorSchemeRgr = '#FBBC05';   // Yellow
    public static DefaultRange6ColorSchemeRgr = '#FB9B05';   // Orange
    public static DefaultRange7ColorSchemeRgr = '#EA4335';   // Red

    // Green/Red/Green Color Scheme
    public static DefaultRange1ColorSchemeGrg = '#34A853';   // Green
    public static DefaultRange2ColorSchemeGrg = '#FBBC05';   // Yellow
    public static DefaultRange3ColorSchemeGrg = '#FB9B05';   // Orange
    public static DefaultRange4ColorSchemeGrg = '#EA4335';   // Red
    public static DefaultRange5ColorSchemeGrg = '#FB9B05';   // Orange
    public static DefaultRange6ColorSchemeGrg = '#FBBC05';   // Yellow
    public static DefaultRange7ColorSchemeGrg = '#34A853';   // Green

    public static DefaultLabelColor: string = '#777777';

    public static DefaultCalloutFontSizeInPt = 20;
    public static DefaultCalloutPercentFontSizeInPt = 14;

    // Radius of center arc as a factor of main arc
    private static BaseArcRadiusFactor = 20;
    private static MaxTargetRadiusFactor = 100 - Tachometer.BaseArcRadiusFactor;

    // Width of needle as a factor of its height
    private static NeedleHeightToWidthRatio: number = 0.05;
    private static MainTachometerGroupClassName = 'mainGroup';
    private static AxisLabelsGroupClassName = 'axisLablesGroup';
    private static OverlayTachometerGroupClassName = 'overlayGroup';
    private static LabelText: ClassAndSelector = createClassAndSelector('labelText');
    private static TargetConnector: ClassAndSelector = createClassAndSelector('targetConnector');
    private static TargetText: ClassAndSelector = createClassAndSelector('targetText');
    private static DegreeToRadConversionFactor: number = Math.PI / 180;
    private static RadToDegreeConversionFactor: number = 180 / Math.PI;
    private static TwoPI: number = Math.PI * 2;

    public static formatStringProp: DataViewObjectPropertyIdentifier = {
        objectName: 'general',
        propertyName: 'formatString',
    };

    private static OverlapTolerance: number = 4;
    private static AxisLabelPruningLimit: PruningLimit = { width: 3, height: 5 };
    private static TargetLabelPruningLimit: PruningLimit = { width: 3, height: 4 };
    private static CalloutPruningLimit: PruningLimit = { width: 1.2, height: 3 };
    private static RadialClosenessThreshold = Math.PI / 6;
    private static PreferHorizontalThreshold = Math.sin(Math.PI / 4);

    private static LineFunction: d3.Line<any> = d3.line()
        .x((d:any): any => { return d.x})
        .y((d:any): any => { return d.y})
        .curve(d3.curveLinear);

    private static defaultLabelFontFamily: string = 'helvetica, arial, sans-serif';
    private static defaultLabelfontWeight: string = 'normal';
    private static defaultLabelFontSizeInPt: number = 9;
    private static DefaultRangeThickness: number = 50;
    private static CloseToLeftOrRightThreshold = Math.cos(Math.PI / 6);
    private static CloseToTopOrBottomThreshold = Math.cos(Math.PI / 4);

    private static defaultTargetSettings: TachometerTargetData = {
        show: true,
        value: Tachometer.UninitializedStartValue,
        lineColor: '#000000',
        innerRadiusRatio: Tachometer.UninitializedRatio,
        radius: 1,
        innerRadius: 0.5,
        thickness: 2,
        offset: { x: 0, y: 0 },
        textColor: Tachometer.DefaultLabelColor,
        fontSize: minLabelFontSize,
        textHeight: PixelConverter.fromPointToPixel(minLabelFontSize),
    };

    private static defaultIndicatorSettings: TachometerIndicatorData = {
        value: 0,
        needlePoints: [],
        needletransformString: '',
        pointerSizeFactor: 0.8,
        pointerColor: '#B3B3B3',
        baseColor: '#374649',
        baseRadius: 0.3,
        baseInnerRadius: 0,
        baseThicknessFactor: 0.7,
        baseStartAngle: 0,
        baseEndtAngle: 0,
    };

    public static RoleNames: TachometerRoleNames = {
        y: 'Y',
        startValue: 'StartValue',
        endValue: 'EndValue',
        targetValue: 'TargetValue',
        range2StartValue: 'Range2StartValue',
        range3StartValue: 'Range3StartValue',
        range4StartValue: 'Range4StartValue',
        range5StartValue: 'Range5StartValue',
        range6StartValue: 'Range6StartValue',
        range7StartValue: 'Range7StartValue',
        displayFilter: 'DisplayFilter',
    };
    
    private currentViewport: IViewport;
    private selectionManager: ISelectionManager;
    private viewModel: TachometerViewModel;
    private visualEventService: IVisualEventService;

    private svg: d3.Selection<d3.BaseType, any, any, any>;
    private mainGraphicsContext: d3.Selection<d3.BaseType, any, any, any>;
    private axisLabelsGraphicsContext: d3.Selection<d3.BaseType, any, any, any>;
    private axisScale: d3.ScaleLinear<number, number>;
    private range1Arc: d3.Arc<any, d3.DefaultArcObject>;
    private range2Arc: d3.Arc<any, d3.DefaultArcObject>;
    private range3Arc: d3.Arc<any, d3.DefaultArcObject>;
    private range4Arc: d3.Arc<any, d3.DefaultArcObject>;
    private range5Arc: d3.Arc<any, d3.DefaultArcObject>;
    private range6Arc: d3.Arc<any, d3.DefaultArcObject>;
    private range7Arc: d3.Arc<any, d3.DefaultArcObject>;
    private centerArc: d3.Arc<any, d3.DefaultArcObject>;

    private range1ArcPath: d3.Selection<d3.BaseType, any, any, any>;
    private range2ArcPath: d3.Selection<d3.BaseType, any, any, any>;
    private range3ArcPath: d3.Selection<d3.BaseType, any, any, any>;
    private range4ArcPath: d3.Selection<d3.BaseType, any, any, any>;
    private range5ArcPath: d3.Selection<d3.BaseType, any, any, any>;
    private range6ArcPath: d3.Selection<d3.BaseType, any, any, any>;
    private range7ArcPath: d3.Selection<d3.BaseType, any, any, any>;
    private centerArcPath: d3.Selection<d3.BaseType, any, any, any>;
    private calloutLabel: d3.Selection<d3.BaseType, any, any, any>;
    private calloutRectangle: TachometerRectangle;
    private calloutPercent: d3.Selection<d3.BaseType, any, any, any>;
    private calloutPercentRectangle: TachometerRectangle;
    private needle: d3.Selection<d3.BaseType, any, any, any>;
    private targetIndicator: d3.Selection<d3.BaseType, any, any, any>;
    private targetConnector: d3.Selection<d3.BaseType, any, any, any>;
    private targetText: d3.Selection<d3.BaseType, any, any, any>;
    private gaugeStyle: TachometerStyle;
    private axisData: TachometerAxisData;
    private axisLabels: TachometerAxisLabel[];
    private tachometerSmallViewPortProperties: TachometerSmallViewPortProperties;
    private showAxisLabels: boolean = false;
    private showTargetLabel: boolean = false;
    private showCalloutValue: boolean = false;
    private showCalloutPercent: boolean = false;
    private tooltipsEnabled: boolean;
    private dataView: DataView;
    private metadataColumn: DataViewMetadataColumn;

    private marginSettings: IMargin = {
        top: Tachometer.DefaultMarginSettings.top,
        bottom: Tachometer.DefaultMarginSettings.bottom,
        left: Tachometer.DefaultMarginSettings.left,
        right: Tachometer.DefaultMarginSettings.right
    };

    constructor(options: VisualConstructorOptions) {
        this.visualEventService = options.host.eventService;
        this.selectionManager = options.host.createSelectionManager();

        this.gaugeStyle = Tachometer.DefaultStyleProperties;
        this.axisData = Tachometer.initializeTachometerData();

        this.setAxisScale(this.axisData);

        let svg = this.svg = d3.select(options.element).append('svg').classed(Tachometer.VisualClassName, true);

        let mainGraphicsContext = this.mainGraphicsContext = svg.append('g')
            .attr('class', Tachometer.MainTachometerGroupClassName);

        this.axisLabelsGraphicsContext = svg.append('g')
            .attr('class', Tachometer.AxisLabelsGroupClassName);

        let overlayGraphicsContext = svg.append('g')
            .attr('class', Tachometer.OverlayTachometerGroupClassName);

        this.range1Arc = d3.arc();
        this.range2Arc = d3.arc();
        this.range3Arc = d3.arc();
        this.range4Arc = d3.arc();
        this.range5Arc = d3.arc();
        this.range6Arc = d3.arc();
        this.range7Arc = d3.arc();
        this.centerArc = d3.arc();

        this.range1ArcPath = mainGraphicsContext.append('path').classed('range1Arc', true);
        this.range2ArcPath = mainGraphicsContext.append('path').classed('range2Arc', true);
        this.range3ArcPath = mainGraphicsContext.append('path').classed('range3Arc', true);
        this.range4ArcPath = mainGraphicsContext.append('path').classed('range4Arc', true);
        this.range5ArcPath = mainGraphicsContext.append('path').classed('range5Arc', true);
        this.range6ArcPath = mainGraphicsContext.append('path').classed('range6Arc', true);
        this.range7ArcPath = mainGraphicsContext.append('path').classed('range7Arc', true);

        // The needle is added to overlay context to make sure it always renders above target indicator
        this.needle = overlayGraphicsContext.append('path')
            .classed('needle', true)
            .attr('stroke-width', Tachometer.DefaultStyleProperties.indicator.thickness)
            .attr('fill', Tachometer.DefaultStyleProperties.indicator.fill);

        // center arc should be rendered above the needle
        this.centerArcPath = overlayGraphicsContext.append('path').classed('centerArc', true);

        this.calloutLabel = overlayGraphicsContext.append('text').classed('calloutLabel', true);
        this.calloutPercent = overlayGraphicsContext.append('text').classed('calloutPercent', true);

        this.handleContextMenu();
    }

    public update(options: VisualUpdateOptions) {
        this.visualEventService.renderingStarted(options);

        try {
            if (!options || !options.dataViews || !options.dataViews[0]) {
                return;
            }

            this.currentViewport = options.viewport;

            this.dataView = options.dataViews[0];
    
            let viewModel: TachometerViewModel = this.viewModel = this.transform(options.dataViews[0], this.tooltipsEnabled);
    
            viewModel = this.completeViewModel(viewModel);
    
            this.drawViewPort(viewModel);

            this.visualEventService.renderingFinished(options);
        } catch (e) {
            this.visualEventService.renderingFailed(options, e);
        }
    }

    public destroy() {
        this.svg = null;
    }

    private static initializeTachometerData(): TachometerAxisData {
        return {
            show: true,
            startValue: Tachometer.UninitializedStartValue,
            endValue: Tachometer.UninitializedEndValue,
            startAngle: Tachometer.UnintializedStartAngle,
            endAngle: Tachometer.UnintializedEndAngle,
            axisScaleType: AxisScaleType.linear,
            value: 0,
            radius: 1,
            axisLabelRadius: 1,
            valueRange: 0,
            angleRange: 0,
            directionClockwise: true,
            startQuadrant: 3,
            endQuadrant: 2,
            cosStartAngle: 0,
            cosEndAngle: 1,
            sinStartAngle: 1,
            sinEndAngle: 0,
            range1: { startValue: Tachometer.UnintializedRangeStartValue, endValue: Tachometer.UninitializedEndValue, rangeColor: Tachometer.DefaultRange1ColorSchemeRgr, innerRadiusRatio: 0.5, radius: 1, innerRadius: 0.5, startAngle: 0, endAngle: 0, },
            range2: { startValue: Tachometer.UnintializedRangeStartValue, endValue: Tachometer.UninitializedEndValue, rangeColor: Tachometer.DefaultRange2ColorSchemeRgr, innerRadiusRatio: 0.5, radius: 1, innerRadius: 0.5, startAngle: 0, endAngle: 0, },
            range3: { startValue: Tachometer.UnintializedRangeStartValue, endValue: Tachometer.UninitializedEndValue, rangeColor: Tachometer.DefaultRange3ColorSchemeRgr, innerRadiusRatio: 0.5, radius: 1, innerRadius: 0.5, startAngle: 0, endAngle: 0, },
            range4: { startValue: Tachometer.UnintializedRangeStartValue, endValue: Tachometer.UninitializedEndValue, rangeColor: Tachometer.DefaultRange3ColorSchemeRgr, innerRadiusRatio: 0.5, radius: 1, innerRadius: 0.5, startAngle: 0, endAngle: 0, },
            range5: { startValue: Tachometer.UnintializedRangeStartValue, endValue: Tachometer.UninitializedEndValue, rangeColor: Tachometer.DefaultRange3ColorSchemeRgr, innerRadiusRatio: 0.5, radius: 1, innerRadius: 0.5, startAngle: 0, endAngle: 0, },
            range6: { startValue: Tachometer.UnintializedRangeStartValue, endValue: Tachometer.UninitializedEndValue, rangeColor: Tachometer.DefaultRange3ColorSchemeRgr, innerRadiusRatio: 0.5, radius: 1, innerRadius: 0.5, startAngle: 0, endAngle: 0, },
            range7: { startValue: Tachometer.UnintializedRangeStartValue, endValue: Tachometer.UninitializedEndValue, rangeColor: Tachometer.DefaultRange3ColorSchemeRgr, innerRadiusRatio: 0.5, radius: 1, innerRadius: 0.5, startAngle: 0, endAngle: 0, },
            target: {
                show: Tachometer.defaultTargetSettings.show,
                value: Tachometer.defaultTargetSettings.value,
                lineColor: Tachometer.defaultTargetSettings.lineColor,
                innerRadiusRatio: Tachometer.defaultTargetSettings.innerRadiusRatio,
                radius: Tachometer.defaultTargetSettings.radius,
                innerRadius: Tachometer.defaultTargetSettings.innerRadius,
                thickness: Tachometer.defaultTargetSettings.thickness,
                offset: {
                    x: Tachometer.defaultTargetSettings.offset.x,
                    y: Tachometer.defaultTargetSettings.offset.y
                },
                textColor: Tachometer.defaultTargetSettings.textColor,
                fontSize: Tachometer.defaultTargetSettings.fontSize,
                textHeight: Tachometer.defaultTargetSettings.textHeight,
            },
            offset: {
                x: 0,
                y: 0
            },
            transformString: '',
            percent: 0,
            dataLabels: {
                show: true
            },
            indicator: {
                value: Tachometer.defaultIndicatorSettings.value,
                needlePoints: Tachometer.defaultIndicatorSettings.needlePoints,
                needletransformString: Tachometer.defaultIndicatorSettings.needletransformString,
                pointerSizeFactor: Tachometer.defaultIndicatorSettings.pointerSizeFactor,
                pointerColor: Tachometer.defaultIndicatorSettings.pointerColor,
                baseColor: Tachometer.defaultIndicatorSettings.baseColor,
                baseRadius: Tachometer.defaultIndicatorSettings.baseRadius,
                baseInnerRadius: Tachometer.defaultIndicatorSettings.baseInnerRadius,
                baseThicknessFactor: Tachometer.defaultIndicatorSettings.baseThicknessFactor,
                baseStartAngle: Tachometer.defaultIndicatorSettings.baseStartAngle,
                baseEndtAngle: Tachometer.defaultIndicatorSettings.baseEndtAngle,
            }
        };
    }

    private handleContextMenu() {
        this.svg.on('contextmenu', () => {
            const mouseEvent: MouseEvent = d3.event as MouseEvent;
            const eventTarget: EventTarget = mouseEvent.target;

            let dataPoint: any = d3Select(<d3.BaseType>eventTarget).datum();

            this.selectionManager.showContextMenu(dataPoint ? dataPoint.selectionId : {}, {
                x: mouseEvent.clientX,
                y: mouseEvent.clientY
            });

            mouseEvent.preventDefault();
        });
    }

    private setAxisScale(axisData: TachometerAxisData) {
        let domainStart: number = axisData.startValue;
        let domainEnd: number = axisData.endValue;

        if (axisData.axisScaleType && axisData.axisScaleType === AxisScaleType.log) {
            if ((domainStart > 0 && domainEnd > 0) || (domainStart < 0 && domainEnd < 0)) {
                this.axisScale = d3.scaleLog();
            } else if ((domainStart === 0) && (Math.abs(domainEnd) > 1)) {
                // make it as close to zero as possible
                axisData.startValue = domainStart = Math.min(1, Math.exp(Math.log(domainEnd) / 10));

                this.axisScale = d3.scaleLog();
            } else if ((domainEnd === 0) && (Math.abs(domainStart) > 1)) {
                // make it as close to zero as possible
                axisData.endValue = domainEnd = Math.min(1, Math.exp(Math.log(domainStart) / 10));

                this.axisScale = d3.scaleLog();
            } else {
                // if data span from -ve to +ve then log scale cannot be used so fall back to linear without complaining or scale is < 1
                this.setNiceLinearScale();
            }
        } else {
            this.setNiceLinearScale();
        }

        this.axisScale.domain([domainStart, domainEnd])
            .range([axisData.startAngle, axisData.endAngle])
            .clamp(true);
    }

    private setNiceLinearScale() {
        this.axisScale = d3.scaleLinear();

        let dataLabels: TachometerDataLabelsData = (this.axisData) ? this.axisData.dataLabels : null;

        if (dataLabels && dataLabels.show && dataLabels.round) {
            // get rounded tick marks
            if (dataLabels.count > 0) {
                this.axisScale.nice(dataLabels.count);
            } else {
                this.axisScale.nice();
            }
        }
    }

    private transform(dataView: DataView, tooltipsEnabled: boolean = true): TachometerViewModel {
        const visualSettings: VisualSettings = VisualSettings.PARSE_SETTINGS(dataView);

        this.metadataColumn = Tachometer.GET_METADATA_COLUMN(dataView);

        this.transformMarginSettings(dataView, visualSettings);

        let axisData: TachometerAxisData = this.transformTachometerData(dataView, visualSettings);

        return {
            axis: axisData,
            callout: {
                calloutValue: this.transformCalloutValue(dataView, axisData, visualSettings),
                calloutPercent: this.transformCalloutPercent(dataView, axisData, visualSettings),
                baseOffset: { x: 0, y: 0 },
            },
            availableHeight: 0,
            availableWidth: 0,
            viewportHeight: 0,
            viewportWidth: 0,

            settings: visualSettings
        };
    }

    private completeViewModel(viewModel: TachometerViewModel): TachometerViewModel {
        let viewport = this.currentViewport;
        let calloutTextHeight = 0;
        let calloutValueSpace = 0;
        let calloutPercentTextHeight = 0;
        let calloutPercentSpace = 0;
        let axisData = viewModel.axis;
        let calloutValueUserDefinedYOffset = 0;
        let calloutPercentUserDefinedYOffset = 0;
        let maxRenderWidth = viewport.width - 2 * Tachometer.ReducedHorizontalMargin;
        let maxRenderHeight = viewport.height - this.marginSettings.top - this.marginSettings.bottom;

        this.axisData = axisData;

        this.setAxisScale(axisData);

        let callout: TachometerCalloutSettings = viewModel.callout;
        let calloutValue = callout ? callout.calloutValue : undefined;
        let calloutPercent = callout ? callout.calloutPercent : undefined;

        this.setCalloutPercentValue(calloutPercent, axisData);
        this.completeTargetTextProperties(axisData);

        this.completeShowLabels(axisData, maxRenderWidth, maxRenderHeight, calloutValue, calloutPercent);

        axisData.dataLabels.formatter = this.getWiderFormatter(axisData.dataLabels, axisData.startValue, axisData.endValue);

        let margins: Margins = this.defineMargins(axisData);
        let availableWidth = this.getAvailebleWidth(viewport, margins);

        if (availableWidth < 0) {
            this.showAxisLabels = false;
            this.showTargetLabel = false;

            margins = this.defineMargins(axisData);
            availableWidth = this.getAvailebleWidth(viewport, margins);

            if (availableWidth < 0) {
                availableWidth = 0;

                this.showCalloutValue = false;
                this.showCalloutPercent = false;
            }
        }

        if (this.showCalloutPercent) {
            calloutPercentTextHeight = callout.calloutPercent.textHeight + this.gaugeStyle.callout.padding;

            let yOffsetBaseEstimate = viewport.height - (this.marginSettings.bottom + calloutPercentTextHeight);

            // Adjust for user defined label displacement
            calloutPercentUserDefinedYOffset = Tachometer.translateUserYOffset(yOffsetBaseEstimate, callout.calloutPercent, viewport.height, this.gaugeStyle.callout.padding);
            calloutPercentSpace = calloutPercentUserDefinedYOffset >= 0 ? calloutPercentTextHeight : Math.max(calloutPercentTextHeight + calloutPercentUserDefinedYOffset, 0);
        }

        if (this.showCalloutValue) {
            calloutTextHeight = callout.calloutValue.textHeight + this.gaugeStyle.callout.padding;

            let yOffsetBaseEstimate = viewport.height - (this.marginSettings.bottom + calloutTextHeight);

            // Adjust for user defined label displacement
            calloutValueUserDefinedYOffset = Tachometer.translateUserYOffset(yOffsetBaseEstimate, callout.calloutValue, viewport.height, this.gaugeStyle.callout.padding);
            calloutValueSpace = calloutValueUserDefinedYOffset >= 0 ? calloutTextHeight : Math.max(calloutTextHeight + calloutValueUserDefinedYOffset, 0);
        }

        let availableHeight = this.getAvailebleHeight(viewport, margins, calloutValueSpace, calloutPercentSpace);

        if (availableHeight < 0) {
            this.showAxisLabels = this.showTargetLabel = this.showCalloutValue = this.showCalloutPercent = false;

            calloutValueSpace = calloutPercentSpace = 0;
            margins = this.defineMargins(axisData);
            availableHeight = Math.max(viewport.height - margins.mainMargin.top - margins.mainMargin.bottom, 0);
        }

        let translation = this.completeTranslation(axisData, margins, availableHeight, availableWidth, viewport, calloutValueSpace, calloutPercentSpace);

        viewModel.viewportHeight = viewport.height;
        viewModel.viewportWidth = viewport.width;
        viewModel.availableHeight = availableHeight;
        viewModel.availableWidth = availableWidth;
        viewModel.axis = this.completeAxis(axisData, translation);
        viewModel.callout = this.completeCallout(callout, translation);

        return viewModel;
    }

    // Breaking up completeViewModel to get around 100 line limit for certification.
    private completeShowLabels(axisData: TachometerAxisData, maxRenderWidth: number, maxRenderHeight: number, calloutValue: any, calloutPercent: any): void {
        let showLabels = this.showLabelText();

        // Only show the target label if:
        //   1. There is a target
        //   2. The viewport width is big enough for a target
        this.showAxisLabels = axisData.dataLabels.show
            && (maxRenderWidth > Tachometer.MinWidthForAxisLabel)
            && (maxRenderWidth > axisData.dataLabels.textWidth * Tachometer.AxisLabelPruningLimit.width)
            && (maxRenderHeight > Tachometer.MinHeightForAxisLabel)
            && (maxRenderHeight > axisData.dataLabels.textHeight * Tachometer.AxisLabelPruningLimit.height)
            && showLabels;

        // Only show the target label if:
        //   1. There is a target
        //   2. The viewport width is big enough for a target
        this.showTargetLabel = isFinite(axisData.target.value)
            && axisData.target.show
            && (maxRenderWidth > Tachometer.MinWidthForTargetLabel)
            && (maxRenderWidth > axisData.target.textWidth * Tachometer.TargetLabelPruningLimit.width)
            && (maxRenderHeight > Tachometer.MinHeightForTargetLabel)
            && (maxRenderHeight > axisData.target.textHeight * Tachometer.TargetLabelPruningLimit.height)
            && showLabels;

        // Only show the callout Value label if:
        //   1. There is a callout Value
        //   2. The viewport width is big enough for callout
        this.showCalloutValue = calloutValue
            && calloutValue.show
            && (maxRenderWidth > Tachometer.MinWidthForCalloutLabel)
            && (maxRenderWidth > calloutValue.textWidth * Tachometer.CalloutPruningLimit.width)
            && (maxRenderHeight > Tachometer.MinHeightForCalloutLabel)
            && (maxRenderHeight > calloutValue.textHeight * Tachometer.CalloutPruningLimit.height)
            && showLabels;

        // Only show the callout Percent label if:
        //   1. There is a callout Percent
        //   2. The viewport width is big enough for callout percent
        this.showCalloutPercent = calloutPercent
            && calloutPercent.show
            && (maxRenderWidth > Tachometer.MinWidthForCalloutPercentLabel)
            && (maxRenderWidth > calloutPercent.textWidth * Tachometer.CalloutPruningLimit.width)
            && (maxRenderHeight - (this.showCalloutValue ? calloutPercent.textHeight : 0) > Tachometer.MinHeightForCalloutPercentLabel)
            && (maxRenderHeight - (this.showCalloutValue ? calloutPercent.textHeight : 0) > calloutPercent.textHeight * Tachometer.CalloutPruningLimit.height)
            && showLabels;
    }
    
    // Breaking up completeViewModel to get around 100 line limit for certification.
    private completeTranslation(axisData: TachometerAxisData, margins: Margins, availableHeight: number, availableWidth: number, viewport: powerbi.IViewport, calloutValueSpace: number, calloutPercentSpace: number): TachometerTranslationSettings {
        let translation: TachometerTranslationSettings = this.calculateGaugeTranslation(axisData, axisData.startAngle, axisData.endAngle, availableHeight, availableWidth);
        let radius = translation.radius;    // Remove axis labels and recalculate gauge translation if radius is too small

        if (this.showAxisLabels && (radius < Math.max(margins.labelMargin.top, margins.labelMargin.bottom))) {
            this.showAxisLabels = false;

            margins = this.defineMargins(axisData);

            let availableHeight = this.getAvailebleHeight(viewport, margins, calloutValueSpace, calloutPercentSpace);

            if (availableHeight < 0) {
                this.showAxisLabels = this.showTargetLabel = this.showCalloutValue = this.showCalloutPercent = false;

                calloutValueSpace = calloutPercentSpace = 0;
                margins = this.defineMargins(axisData);
                availableHeight = Math.max(this.getAvailebleHeight(viewport, margins, calloutValueSpace, calloutPercentSpace), 0);
            }

            let availableWidth = this.getAvailebleWidth(viewport, margins);

            if (availableWidth < 0) {
                this.showAxisLabels = false;
                this.showTargetLabel = false;

                margins.mainMargin.left = margins.mainMargin.right = Tachometer.ReducedHorizontalMargin;
                availableWidth = viewport.width - margins.mainMargin.right - margins.mainMargin.left;

                if (availableWidth < 0) {
                    availableWidth = 0;

                    this.showCalloutValue = false;
                    this.showCalloutPercent = false;
                }
            }

            translation = this.calculateGaugeTranslation(axisData, axisData.startAngle, axisData.endAngle, availableHeight, availableWidth);
            radius = translation.radius;
        }

        // Remove target label and recalculate gauge translation if radius is too small
        if (this.showTargetLabel && (radius < Math.max(margins.labelMargin.top, margins.labelMargin.bottom))) {
            this.showTargetLabel = false;

            margins = this.defineMargins(axisData);

            let availableHeight = this.getAvailebleHeight(viewport, margins, calloutValueSpace, calloutPercentSpace);

            if (availableHeight < 0) {
                this.showAxisLabels = this.showTargetLabel = this.showCalloutValue = this.showCalloutPercent = false;

                calloutValueSpace = calloutPercentSpace = 0;
                margins = this.defineMargins(axisData);
                availableHeight = Math.max(this.getAvailebleHeight(viewport, margins, calloutValueSpace, calloutPercentSpace), 0);
            }

            let availableWidth = this.getAvailebleWidth(viewport, margins);

            if (availableWidth < 0) {
                this.showAxisLabels = false;
                this.showTargetLabel = false;

                margins.mainMargin.left = margins.mainMargin.right = Tachometer.ReducedHorizontalMargin;
                availableWidth = viewport.width - margins.mainMargin.right - margins.mainMargin.left;

                if (availableWidth < 0) {
                    availableWidth = 0;

                    this.showCalloutValue = false;
                    this.showCalloutPercent = false;
                }
            }

            translation = this.calculateGaugeTranslation(axisData, axisData.startAngle, axisData.endAngle, availableHeight, availableWidth);
        }

        // Hide all visal components.
        if (!axisData.show) {
            translation.radius = 0;

            this.showCalloutValue = false;
            this.showCalloutPercent = false;
            this.showAxisLabels = false;
            this.showTargetLabel = false;
        }
 
        // the translation above should be moved down by this much to accomodate for target and axisLabels and margin
        let translationOffsetY = margins.mainMargin.top + margins.labelMargin.top + margins.targetMargin.top;

        translation.yOffset += translationOffsetY;
        translation.calloutyOffset += translationOffsetY + margins.labelMargin.bottom + margins.targetMargin.bottom;

        // the translation above should be moved right by this much to accomodate for target and axisLabels and margin
        let translationOffsetX = margins.mainMargin.left + Math.max(margins.labelMargin.left, margins.targetMargin.left);

        translation.xOffset += translationOffsetX;
        translation.calloutxOffset += translationOffsetX;

        return translation;
    }

    public drawViewPort(viewModel: TachometerViewModel): void {
        this.updateVisualComponents(viewModel);

        // callout should be updated after axis labels
        this.updateCallout(viewModel);

        this.axisLabels = this.createAxisLabels();
        this.updateAxisLabelText(viewModel.axis, this.axisLabels);

        // target should be updated after axis labels and callout
        this.updateTarget(viewModel);

        this.svg.attr('height', this.currentViewport.height).attr('width', this.currentViewport.width);
    }

    private transformTachometerData(dataView: DataView, visualSettings: VisualSettings): TachometerAxisData {
        let axisData: TachometerAxisData = this.resetTachometerData();

        axisData = this.transformTachometerDataRoles(dataView, axisData);
        axisData = this.transformTachometerSettings(dataView, axisData, visualSettings);

        return axisData;
    }

    public static GET_METADATA_COLUMN (dataView: DataView) {
        if (dataView && dataView.metadata && dataView.metadata.columns) {
            for (let i = 0, ilen = dataView.metadata.columns.length; i < ilen; i++) {
                let column = dataView.metadata.columns[i];

                if (column.isMeasure) {
                    return column;
                }
            }
        }

        return null;
    }

    private transformCalloutValue(dataView: DataView, axisData: TachometerAxisData, visualSettings: VisualSettings): TachometerDataLabelsData {
        let callout: TachometerDataLabelsData = Tachometer.transformDataLabelSettings(dataView, 'calloutValue', Tachometer.getDefaultTachometerCalloutSettings(), visualSettings && visualSettings.calloutValue);

        if (callout.show) {
            let value = axisData.value;
            let formatter = this.getFormatter(callout.displayUnits, callout.precision, value);
            let formattedValue = formatter.format(value);

            callout.formattedValue = formattedValue;
            callout.textWidth = Tachometer.getTextWidth(callout.fontSizePx, formattedValue);
        }

        return callout;
    }

    private transformCalloutPercent(dataView: DataView, axisData: TachometerAxisData, visualSettings: VisualSettings): TachometerDataLabelsData {
        return Tachometer.transformDataLabelSettings(dataView, 'calloutPercent', Tachometer.getDefaultTachometerCalloutPercentSettings(), visualSettings && visualSettings.calloutPercent);
    }

    private setCalloutPercentValue(calloutPercent: TachometerDataLabelsData, axisData: TachometerAxisData): TachometerDataLabelsData {
        if (calloutPercent && calloutPercent.show) {
            let value = this.getCalloutPercentDisplayValue(calloutPercent, axisData);
            let formatter = this.getFormatter(calloutPercent.displayUnits, calloutPercent.precision, value, true);
            let formattedValue = formatter.format(value);

            formattedValue = (formattedValue === undefined) ? ' [-%]' : ' [' + formattedValue + '%]';

            calloutPercent.formattedValue = formattedValue;
            calloutPercent.textWidth = Tachometer.getTextWidth(calloutPercent.fontSizePx, formattedValue);
        }

        return calloutPercent;
    }

    private getCalloutPercentDisplayValue(calloutPercent: TachometerDataLabelsData, axisData: TachometerAxisData): number {
        let baseValue: number = calloutPercent.invert ? axisData.endValue : axisData.startValue;
        let hundredPercentValue: number;

        switch (calloutPercent.percentType) {
            case PercentType.endValue:
                hundredPercentValue = calloutPercent.invert ? axisData.startValue : axisData.endValue;

                break;
            case PercentType.target:
                hundredPercentValue = axisData.target.value;

                break;
            case PercentType.range2Start:
                hundredPercentValue = axisData.range2.startValue;

                break;
            case PercentType.range3Start:
                hundredPercentValue = axisData.range3.startValue;

                break;
            case PercentType.range4Start:
                hundredPercentValue = axisData.range4.startValue;

                break;
            case PercentType.range5Start:
                hundredPercentValue = axisData.range5.startValue;

                break;
            case PercentType.range6Start:
                hundredPercentValue = axisData.range6.startValue;

                break;
            case PercentType.range7Start:
                hundredPercentValue = axisData.range7.startValue;

                break;
        }

        return axisData.valueRange !== 0 ? Math.abs((axisData.value - baseValue) * 100 / (hundredPercentValue - baseValue)) : 0;
    }

    private completeTargetTextProperties(axis: TachometerAxisData) {
        // this method has to be called before we calculate the gauge radius but
        // after reading target Properties as well as gauge axis label properties becaust of the dependancy below
        let targetSettings = axis.target;

        if (targetSettings.show) {
            let dataLabels = axis.dataLabels;
            let value = targetSettings.value;
            // Note: Target uses DataLabel settings
            let formatter = this.getFormatter(dataLabels.displayUnits, dataLabels.precision, value);
            let formattedValue = formatter.format(value);

            targetSettings.formattedValue = formattedValue;
            targetSettings.textWidth = Tachometer.getTextWidth(targetSettings.fontSizePx, formattedValue);
        }
    }
    private showLabelText(): boolean {
        if (this.tachometerSmallViewPortProperties) {
            if (this.tachometerSmallViewPortProperties.hideTachometerSideNumbersOnSmallViewPort) {
                if (this.currentViewport.height < this.tachometerSmallViewPortProperties.MinHeightTachometerSideNumbersVisible) {
                    return false;
                }
            }
        }

        return true;
    }

    private getWiderFormatter(dataLabelSettings: TachometerDataLabelsData, value1: number, value2: number): IValueFormatter {
        let widerLabelValue = Math.abs(value1) > Math.abs(value2) ? value1 : value2;

        return this.getFormatter(dataLabelSettings.displayUnits, dataLabelSettings.precision, widerLabelValue);
    }

    private defineMargins(axisData: TachometerAxisData): Margins {
        if (this.tachometerSmallViewPortProperties) {
            if (this.tachometerSmallViewPortProperties.smallTachometerMarginsOnSmallViewPort && (this.currentViewport.height < this.tachometerSmallViewPortProperties.MinHeightTachometerSideNumbersVisible)) {
                let smallMargin = this.tachometerSmallViewPortProperties.TachometerMarginsOnSmallViewPort;

                return {
                    mainMargin: { top: smallMargin, bottom: smallMargin, left: smallMargin, right: smallMargin },
                    labelMargin: this.getZeroMargin(),
                    targetMargin: this.getZeroMargin()
                };
            }
        }

        let targetMargin: IMargin = this.addPadding(this.getTargetMargin(axisData), this.gaugeStyle.target.padding);
        let labelMargin: IMargin = this.addPadding(this.getLabelMargins(axisData), this.gaugeStyle.labels.padding);

        let MainMargin = this.marginSettings;

        return {
            mainMargin: MainMargin,
            labelMargin: labelMargin,
            targetMargin: targetMargin
        };
    }

    private addPadding(margin: IMargin, padding: number): IMargin {
        return {
            top: margin.top > 0 ? margin.top + padding : 0,
            bottom: margin.bottom > 0 ? margin.bottom + padding : 0,
            left: margin.left > 0 ? margin.left + padding : 0,
            right: margin.right > 0 ? margin.right + padding : 0
        };
    }

    private getTargetMargin(axisData: TachometerAxisData): IMargin {
        let targetMargin = this.getZeroMargin();

        let target = axisData ? axisData.target : null;

        if (target == null || !this.showTargetLabel) {
            return targetMargin;
        }

        let verticalMargin = target.textHeight;
        let horizontalMargin = target.textWidth;
        let startAngle = axisData.startAngle;
        let endAngle = axisData.endAngle;
        let startQuadrant: number = axisData.startQuadrant;
        let endQuadrant: number = axisData.endQuadrant;
        let cosAlpha: number = Math.abs(axisData.cosStartAngle);
        let cosBeta: number = Math.abs(axisData.cosEndAngle);
        let targetAngle = this.axisScale(target.value);
        let unitRadialClosenessThreshold = Math.abs(Math.cos(Tachometer.RadialClosenessThreshold));

        // get general case targetMargins
        targetMargin = this.setClosestMargin(targetMargin, targetAngle, verticalMargin, horizontalMargin);

        // handle special cases
        switch (startQuadrant) {
            case 1:
                targetMargin = this.getTargetMarginQuadrant1(targetMargin, horizontalMargin, verticalMargin, endQuadrant, startAngle, endAngle, targetAngle, unitRadialClosenessThreshold, cosAlpha, cosBeta);
            case 2:
                targetMargin = this.getTargetMarginQuadrant2(targetMargin, horizontalMargin, verticalMargin, endQuadrant, startAngle, endAngle, targetAngle, unitRadialClosenessThreshold, cosAlpha, cosBeta);
            case 3:
                targetMargin = this.getTargetMarginQuadrant3(targetMargin, horizontalMargin, verticalMargin, endQuadrant, startAngle, endAngle, targetAngle, unitRadialClosenessThreshold, cosAlpha, cosBeta);
            case 4:
                targetMargin = this.getTargetMarginQuadrant4(targetMargin, horizontalMargin, verticalMargin, endQuadrant, startAngle, endAngle, targetAngle, unitRadialClosenessThreshold, cosAlpha, cosBeta);
            default:
                // this should not be reached
                break;
        }

        return targetMargin;
    }

    // Breaking up getTargetMargin to get around 100 line limit for certification.
    private getTargetMarginQuadrant1(targetMargin: IMargin, horizontalMargin: number, verticalMargin: number, endQuadrant: number, startAngle: number, endAngle: number, targetAngle: number, unitRadialClosenessThreshold: number, cosAlpha: number, cosBeta: number): IMargin {
        switch (endQuadrant) {
            case 1:
                if (cosAlpha > cosBeta) {
                    // start angle < endAngle
                    targetMargin.right = horizontalMargin;

                    if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                        // close to start
                        targetMargin.top = verticalMargin;
                    }

                    if (this.showAxisLabels) {
                        // Add room to adjust if axis labels are present
                        if (Math.abs(Math.cos(targetAngle)) > unitRadialClosenessThreshold) {
                            // close to vertical
                            targetMargin.left = horizontalMargin;
                        } else if (Math.sin(targetAngle) > unitRadialClosenessThreshold) {
                            // close to PI/2
                            targetMargin.bottom = verticalMargin;
                        }
                    }
                }

                break;
            case 2:
                targetMargin.right = horizontalMargin;

                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    targetMargin.top = verticalMargin;

                    if ((this.showAxisLabels) && (Math.abs(Math.cos(targetAngle)) > unitRadialClosenessThreshold)) {
                        // first check: Add room to adjust if axis labels are present
                        // close to vertical
                        targetMargin.left = horizontalMargin;
                    }
                }
                else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    targetMargin.bottom = verticalMargin;

                    if ((this.showAxisLabels) && (Math.abs(Math.cos(targetAngle)) > unitRadialClosenessThreshold)) {
                        // first check: Add room to adjust if axis labels are present
                        // close to vertical
                        targetMargin.left = horizontalMargin;
                    }
                }
                break;
            case 3:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    targetMargin.top = verticalMargin;

                    if (this.showAxisLabels) {
                        // Add room to adjust if axis labels are present
                        if (Math.abs(Math.cos(targetAngle)) > unitRadialClosenessThreshold) {
                            // close to vertical
                            targetMargin.left = horizontalMargin;
                        }
                    }
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    targetMargin.left = horizontalMargin;

                    if ((this.showAxisLabels) && ((Math.abs(Math.sin(targetAngle)) > unitRadialClosenessThreshold) && 
                        ((endAngle - startAngle - Math.PI) < Tachometer.RadialClosenessThreshold))) {
                        // first check: Add room to adjust if axis labels are present
                        // second check: closer to horizontal and start Angle too close to horizontal
                        targetMargin.top = verticalMargin;
                    }
                }

                break;
            case 4:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    if (Math.abs(Math.sin(endAngle - startAngle)) < unitRadialClosenessThreshold) {
                        // StartAngle closer to vertical than endAngle
                        targetMargin.top = verticalMargin;
                    }
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    if (Math.abs(Math.sin(endAngle - startAngle)) > unitRadialClosenessThreshold) {
                        // endAngle closer to vertical than endAngle
                        targetMargin.top = verticalMargin;
                    }
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return targetMargin;        
    }

    // Breaking up getTargetMargin to get around 100 line limit for certification.
    private getTargetMarginQuadrant2(targetMargin: IMargin, horizontalMargin: number, verticalMargin: number, endQuadrant: number, startAngle: number, endAngle: number, targetAngle: number, unitRadialClosenessThreshold: number, cosAlpha: number, cosBeta: number): IMargin {
        switch (endQuadrant) {
            case 1:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.right = horizontalMargin;
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.right = horizontalMargin;
                }

                break;
            case 2:
                if (cosAlpha < cosBeta) {
                    // startAngle < endAngle
                    targetMargin.right = horizontalMargin;

                    if ((this.showAxisLabels) && (Math.abs(Math.sin(targetAngle)) > unitRadialClosenessThreshold)) {
                        // first check: Add room to adjust if axis labels are present
                        // closer to PI/2
                        targetMargin.top = verticalMargin;
                    }

                    if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                        targetMargin.bottom = verticalMargin;
                    }
                }

                break;
            case 3:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.right = horizontalMargin;
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.left = horizontalMargin;
                }

                if (Math.abs(Math.sin(targetAngle)) > unitRadialClosenessThreshold) {
                    // closer to horizontal
                    targetMargin.top = verticalMargin;
                }

                break;
            case 4:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.right = horizontalMargin;

                    if ((this.showAxisLabels) && ((Math.abs(Math.sin(targetAngle)) > unitRadialClosenessThreshold) &&
                        ((endAngle - startAngle - Math.PI) < Tachometer.RadialClosenessThreshold))) {
                        // first check: Add room to adjust if axis labels are present
                        // second check: closer to horizontal and end Angle too close to horizontal
                        targetMargin.top = verticalMargin;
                    }
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.top = verticalMargin;
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return targetMargin;
    }

    // Breaking up getTargetMargin to get around 100 line limit for certification.
    private getTargetMarginQuadrant3(targetMargin: IMargin, horizontalMargin: number, verticalMargin: number, endQuadrant: number, startAngle: number, endAngle: number, targetAngle: number, unitRadialClosenessThreshold: number, cosAlpha: number, cosBeta: number): IMargin {
        switch (endQuadrant) {
            case 1:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.bottom = verticalMargin;

                    if ((this.showAxisLabels) && ((Math.abs(Math.cos(targetAngle)) > unitRadialClosenessThreshold) &&
                        ((endAngle - startAngle - Math.PI) < Tachometer.RadialClosenessThreshold))) {
                        // first check: Add room to adjust if axis labels are present
                        // second check: closer to vertical and end Angle too close to vertical
                        targetMargin.left = horizontalMargin;
                    }
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.right = horizontalMargin;
                }

                break;
            case 2:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.bottom = verticalMargin;
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.bottom = verticalMargin;
                }

                break;
            case 3:
                if (cosAlpha > cosBeta) {
                    // start angle < end angle
                    if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                        // closer to start
                        targetMargin.bottom = verticalMargin;

                        if ((this.showAxisLabels) && (Math.abs(Math.cos(targetAngle)) > unitRadialClosenessThreshold)) {
                            // second check: Add room to adjust if axis labels are present
                            // closer to vertical
                            targetMargin.right = horizontalMargin;
                        }
                    }
                    if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                        // closer to end
                        targetMargin.left = horizontalMargin;

                        if ((this.showAxisLabels) && (Math.abs(Math.sin(targetAngle)) > unitRadialClosenessThreshold)) {
                            // second check: Add room to adjust if axis labels are present
                            // closer to horizontal
                            targetMargin.top = verticalMargin;
                        }
                    }
                }

                break;
            case 4:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.bottom = verticalMargin;
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.top = verticalMargin;
                }

                if ((this.showAxisLabels) && (Math.abs(Math.cos(targetAngle)) > unitRadialClosenessThreshold)) {
                    // second check: Add room to adjust if axis labels are present
                    // closer to vertical
                    targetMargin.right = horizontalMargin;
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return targetMargin;
    }

    // Breaking up getTargetMargin to get around 100 line limit for certification.
    private getTargetMarginQuadrant4(targetMargin: IMargin, horizontalMargin: number, verticalMargin: number, endQuadrant: number, startAngle: number, endAngle: number, targetAngle: number, unitRadialClosenessThreshold: number, cosAlpha: number, cosBeta: number): IMargin {
        switch (endQuadrant) {
            case 1:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.left = horizontalMargin;
                }

                if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.right = horizontalMargin;
                }

                if ((this.showAxisLabels) && (Math.abs(Math.sin(targetAngle)) > unitRadialClosenessThreshold)) {
                    // second check: Add room to adjust if axis labels are present
                    // closer to horizontal
                    targetMargin.bottom = verticalMargin;
                }

                break;
            case 2:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.left = horizontalMargin;

                    if ((this.showAxisLabels) && ((Math.sin(targetAngle) > unitRadialClosenessThreshold) &&
                        ((endAngle - startAngle - Math.PI) < Tachometer.RadialClosenessThreshold))) {
                        // second check: is to Add room to adjust if axis labels are present
                        // third check: closer to horiontal and end Angle too close to horizontal
                        targetMargin.bottom = verticalMargin;
                    }
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.bottom = verticalMargin;
                }

                break;
            case 3:
                if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to start
                    targetMargin.left = horizontalMargin;
                } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                    // closer to end
                    targetMargin.left = horizontalMargin;
                }

                break;
            case 4:
                if (cosAlpha < cosBeta) {
                    // start angle < end angle
                    if (targetAngle - startAngle < Tachometer.RadialClosenessThreshold) {
                        // closer to start
                        targetMargin.left = horizontalMargin;
                    } else if (endAngle - targetAngle < Tachometer.RadialClosenessThreshold) {
                        // closer to end
                        targetMargin.top = verticalMargin;
                    }

                    if (this.showAxisLabels) {
                        // Add room to adjust if axis labels are present
                        if (Math.abs(Math.cos(targetAngle)) > unitRadialClosenessThreshold) {
                            // close to vertical
                            targetMargin.right = horizontalMargin;
                        } else if (Math.abs(Math.sin(targetAngle)) > unitRadialClosenessThreshold) {
                            // close to horizontal
                            targetMargin.bottom = verticalMargin;
                        }
                    }
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return targetMargin;
    }

    private getLabelMargins(axisData: TachometerAxisData): IMargin {
        let labelMargin = this.getZeroMargin();
        let dataLabels: TachometerDataLabelsData = axisData ? axisData.dataLabels : null;

        if (dataLabels == null || !this.showAxisLabels) {
            return labelMargin;
        }

        let labelFontSize = dataLabels.textHeight;
        let labelFontLength = dataLabels.textWidth;

        let startQuadrant: number = axisData.startQuadrant;
        let endQuadrant: number = axisData.endQuadrant;
        let cosAlpha: number = Math.abs(axisData.cosStartAngle);
        let cosBeta: number = Math.abs(axisData.cosEndAngle);
        let startAngle: number = axisData.startAngle;
        let endAngle: number = axisData.endAngle;

        switch (startQuadrant) {
            case 1:
                return this.getLabelMarginsQuadrant1(labelMargin, labelFontSize, labelFontLength, endQuadrant, startAngle, endAngle, cosAlpha, cosBeta);
            case 2:
                return this.getLabelMarginsQuadrant2(labelMargin, labelFontSize, labelFontLength, endQuadrant, startAngle, endAngle, cosAlpha, cosBeta);
            case 3:
                return this.getLabelMarginsQuadrant3(labelMargin, labelFontSize, labelFontLength, endQuadrant, startAngle, endAngle, cosAlpha, cosBeta);
            case 4:
                return this.getLabelMarginsQuadrant4(labelMargin, labelFontSize, labelFontLength, endQuadrant, startAngle, endAngle, cosAlpha, cosBeta);
            default:
                // this should not be reached
                break;
        }

        return labelMargin;
    }

    // Breaking up getLabelMargins to get around 100 line limit for certification.
    private getLabelMarginsQuadrant1(labelMargin: IMargin, labelFontSize: number, labelFontLength: number, endQuadrant: number, startAngle: number, endAngle: number, cosAlpha: number, cosBeta: number): IMargin {
        switch (endQuadrant) {
            case 1:
                if (cosAlpha > cosBeta) {
                    // start angle < endAngle
                    if (endAngle > Tachometer.PiBy4) {
                        // closer to the right
                        labelMargin.right += labelFontLength;
                    }
                    else {
                        labelMargin.right = Tachometer.UnitMargin;
                    }

                    if (startAngle < Tachometer.PiBy4) {
                        // closer to the top
                        labelMargin.top += labelFontSize;
                    } else {
                        labelMargin.top = Tachometer.UnitMargin;
                    }
                } else {
                    labelMargin.top += labelFontSize;
                    labelMargin.bottom += labelFontSize;
                    labelMargin.left += labelFontLength;
                    labelMargin.right += labelFontLength;
                }

                break;
            case 2:
                labelMargin.right += labelFontLength;

                if (startAngle < Tachometer.PiBy4) {
                    // closer to the top
                    labelMargin.top += labelFontSize;
                } else {
                    labelMargin.top = Tachometer.UnitMargin;
                }

                if (endAngle > Tachometer.ThreePiBy4) {
                    // closer to the bottom
                    labelMargin.bottom += labelFontSize;
                } else {
                    labelMargin.bottom = Tachometer.UnitMargin;
                }

                break;
            case 3:
                labelMargin.right += labelFontLength;
                labelMargin.bottom += labelFontSize;

                if (startAngle < Tachometer.PiBy4) {
                    // closer to the top
                    labelMargin.top += labelFontSize;
                } else {
                    labelMargin.top = Tachometer.UnitMargin;
                }

                if (endAngle > Tachometer.MinusThreePiBy4) {
                    // closer to the left
                    labelMargin.left += labelFontLength;
                } else {
                    labelMargin.left = Tachometer.UnitMargin;
                }

                break;
            case 4:
                labelMargin.right += labelFontLength;
                labelMargin.bottom += labelFontSize;
                labelMargin.left += labelFontLength;

                if ((startAngle < Tachometer.PiBy4) || (endAngle > Tachometer.MinusPiBy4)) {
                    // closer to the top
                    labelMargin.top += labelFontSize;
                } else {
                    labelMargin.top = Tachometer.UnitMargin;
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return labelMargin;
    }

    // Breaking up getLabelMargins to get around 100 line limit for certification.
    private getLabelMarginsQuadrant2(labelMargin: IMargin, labelFontSize: number, labelFontLength: number, endQuadrant: number, startAngle: number, endAngle: number, cosAlpha: number, cosBeta: number): IMargin {
        switch (endQuadrant) {
            case 1:
                labelMargin.bottom += labelFontSize;
                labelMargin.left += labelFontLength;
                labelMargin.top += labelFontSize;

                if ((startAngle < Tachometer.ThreePiBy4) || (endAngle > Tachometer.PiBy4)) {
                    // closer to the right
                    labelMargin.right += labelFontLength;
                } else {
                    labelMargin.right = Tachometer.UnitMargin;
                }

                break;
            case 2:
                if (cosAlpha < cosBeta) {
                    // startAngle < endAngle
                    if (startAngle < Tachometer.ThreePiBy4) {
                        // closer to the right
                        labelMargin.right += labelFontLength;
                    } else {
                        labelMargin.right = Tachometer.UnitMargin;
                    }

                    if (endAngle > Tachometer.ThreePiBy4) {
                        // closer to the bottom
                        labelMargin.bottom += labelFontSize;
                    } else {
                        labelMargin.bottom = Tachometer.UnitMargin;
                    }
                } else {
                    // startAngle > endAngle
                    labelMargin.top += labelFontSize;
                    labelMargin.bottom += labelFontSize;
                    labelMargin.left += labelFontLength;
                    labelMargin.right += labelFontLength;
                }
                break;
            case 3:
                labelMargin.bottom += labelFontSize;

                if (startAngle < Tachometer.ThreePiBy4) {
                    // closer to the right
                    labelMargin.right += labelFontLength;
                } else {
                    labelMargin.right = Tachometer.UnitMargin;
                }

                if (endAngle > Tachometer.MinusThreePiBy4) {
                    // closer to the left
                    labelMargin.left += labelFontLength;
                } else {
                    labelMargin.left = Tachometer.UnitMargin;
                }

                break;
            case 4:
                labelMargin.bottom += labelFontSize;
                labelMargin.left += labelFontLength;

                if (endAngle > Tachometer.MinusPiBy4) {
                    // closer to the top
                    labelMargin.top += labelFontSize;
                } else {
                    labelMargin.top = Tachometer.UnitMargin;
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return labelMargin;
    }

    // Breaking up getLabelMargins to get around 100 line limit for certification.
    private getLabelMarginsQuadrant3(labelMargin: IMargin, labelFontSize: number, labelFontLength: number, endQuadrant: number, startAngle: number, endAngle: number, cosAlpha: number, cosBeta: number): IMargin {
        switch (endQuadrant) {
            case 1:
                labelMargin.left += labelFontLength;
                labelMargin.top += labelFontSize;

                if (endAngle > Tachometer.PiBy4) {
                    // closer to the right
                    labelMargin.right += labelFontLength;
                } else {
                    labelMargin.right = Tachometer.UnitMargin;
                }

                if (startAngle < Tachometer.MinusThreePiBy4) {
                    // closer to the bottom
                    labelMargin.bottom += labelFontSize;
                } else {
                    labelMargin.bottom = Tachometer.UnitMargin;
                }

                break;
            case 2:
                labelMargin.left += labelFontLength;
                labelMargin.top += labelFontSize;
                labelMargin.right += labelFontLength;

                if ((startAngle < Tachometer.MinusThreePiBy4) || (endAngle > Tachometer.ThreePiBy4)) {
                    // closer to the bottom
                    labelMargin.bottom += labelFontSize;
                }
                else {
                    labelMargin.bottom = Tachometer.UnitMargin;
                }

                break;
            case 3:
                if (cosAlpha > cosBeta) {
                    // start angle < end angle
                    if (startAngle < Tachometer.MinusThreePiBy4) {
                        // closer to the bottom
                        labelMargin.bottom += labelFontSize;
                    } else {
                        labelMargin.bottom = Tachometer.UnitMargin;
                    }

                    if (endAngle > Tachometer.MinusThreePiBy4) {
                        // closer to the left
                        labelMargin.left += labelFontLength;
                    } else {
                        labelMargin.left = Tachometer.UnitMargin;
                    }
                } else {
                    labelMargin.top += labelFontSize;
                    labelMargin.bottom += labelFontSize;
                    labelMargin.left += labelFontLength;
                    labelMargin.right += labelFontLength;
                }

                break;
            case 4:
                labelMargin.left += labelFontLength;

                if (startAngle < Tachometer.MinusThreePiBy4) {
                    // closer to the bottom
                    labelMargin.bottom += labelFontSize;
                } else {
                    labelMargin.bottom = Tachometer.UnitMargin;
                }

                if (endAngle > Tachometer.MinusPiBy4) {
                    // closer to the rop
                    labelMargin.top += labelFontSize;
                } else {
                    labelMargin.top = Tachometer.UnitMargin;
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return labelMargin;
    }

    // Breaking up getLabelMargins to get around 100 line limit for certification.
    private getLabelMarginsQuadrant4(labelMargin: IMargin, labelFontSize: number, labelFontLength: number, endQuadrant: number, startAngle: number, endAngle: number, cosAlpha: number, cosBeta: number): IMargin {
        switch (endQuadrant) {
            case 1:
                labelMargin.top += labelFontSize;

                if (startAngle < Tachometer.MinusPiBy4) {
                    // closer to the left
                    labelMargin.left += labelFontLength;
                } else {
                    labelMargin.left = Tachometer.UnitMargin;
                }

                if (endAngle > Tachometer.PiBy4) {
                    // closer to the right
                    labelMargin.right += labelFontLength;
                } else {
                    labelMargin.right = Tachometer.UnitMargin;
                }

                break;
            case 2:
                labelMargin.top += labelFontSize;
                labelMargin.right += labelFontLength;

                if (startAngle < Tachometer.MinusPiBy4) {
                    // closer to the left
                    labelMargin.left += labelFontLength;
                } else {
                    labelMargin.left = Tachometer.UnitMargin;
                }

                if (endAngle > Tachometer.ThreePiBy4) {
                    // closer to the bottom
                    labelMargin.bottom += labelFontSize;
                } else {
                    labelMargin.bottom = Tachometer.UnitMargin;
                }

                break;
            case 3:
                labelMargin.top += labelFontSize;
                labelMargin.right += labelFontLength;
                labelMargin.bottom += labelFontSize;

                if (startAngle < Tachometer.MinusPiBy4) {
                    // closer to the left
                    labelMargin.left += labelFontLength;
                } else {
                    labelMargin.left = Tachometer.UnitMargin;
                }

                break;
            case 4:
                if (cosAlpha < cosBeta) {
                    // start angle < end angle
                    if (startAngle < Tachometer.MinusPiBy4) {
                        // closer to the left
                        labelMargin.left += labelFontLength;
                    } else {
                        labelMargin.left = Tachometer.UnitMargin;
                    }

                    if (endAngle > Tachometer.MinusPiBy4) {
                        // closer to the top
                        labelMargin.top += labelFontSize;
                    } else {
                        labelMargin.top = Tachometer.UnitMargin;
                    }
                } else {
                    labelMargin.top += labelFontSize;
                    labelMargin.bottom += labelFontSize;
                    labelMargin.left += labelFontLength;
                    labelMargin.right += labelFontLength;
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return labelMargin;
    }

    private setClosestMargin(targetMargin: IMargin, angle: number, verticalMargin: number, horizontalMargin: number): IMargin {
        let cosAngle = Math.cos(angle);
        let sinAngle = Math.sin(angle);

        if (sinAngle >= 0) {
            if (cosAngle >= 0) {
                if (Math.abs(cosAngle) < Tachometer.CloseToLeftOrRightThreshold) {
                    targetMargin.right = horizontalMargin;
                }

                if (Math.abs(cosAngle) > Tachometer.CloseToTopOrBottomThreshold) {
                    targetMargin.top = verticalMargin;
                }
            }
            else {
                if (Math.abs(cosAngle) < Tachometer.CloseToLeftOrRightThreshold) {
                    targetMargin.right = horizontalMargin;
                }

                if (Math.abs(cosAngle) > Tachometer.CloseToTopOrBottomThreshold) {
                    targetMargin.bottom = verticalMargin;
                }
            }
        } else {
            if (cosAngle >= 0) {
                if (Math.abs(cosAngle) < Tachometer.CloseToLeftOrRightThreshold) {
                    targetMargin.left = horizontalMargin;
                }

                if (Math.abs(cosAngle) > Tachometer.CloseToTopOrBottomThreshold) {
                    targetMargin.top = verticalMargin;
                }
            }
            else {
                if (Math.abs(cosAngle) < Tachometer.CloseToLeftOrRightThreshold) {
                    targetMargin.left = horizontalMargin;
                }

                if (Math.abs(cosAngle) > Tachometer.CloseToTopOrBottomThreshold) {
                    targetMargin.bottom = verticalMargin;
                }
            }
        }

        return targetMargin;
    }

    private getAvailebleWidth(viewport: IViewport, margins: Margins): number {
        return viewport.width
            - margins.mainMargin.left - margins.mainMargin.right
            - Math.max(margins.targetMargin.right, margins.labelMargin.right)
            - Math.max(margins.targetMargin.left, margins.labelMargin.left);
    }

    // Convert the percent value of offset into a pixel value
    private static translateUserYOffset(baseYOffset: number, callout: TachometerDataLabelsData, height: number, padding: number): number {
        let yOffsetPercent = callout.offset.y;

        if (yOffsetPercent !== 0) {
            let topThreshold = padding;
            let bottomThreshold = height - callout.textHeight - padding;
            let userYOffset = yOffsetPercent / 100 * baseYOffset;
            let offset = userYOffset + baseYOffset;

            return offset < topThreshold
                ? topThreshold - baseYOffset // goinig too high
                : offset > bottomThreshold
                    ? bottomThreshold - baseYOffset // going too low
                    : userYOffset;
        }

        return 0;
    }

    private getAvailebleHeight(viewport: IViewport, margins: Margins, calloutValueSpace: number, calloutPercentSpace: number): number {
        return viewport.height
            - margins.mainMargin.top - margins.mainMargin.bottom
            - margins.labelMargin.top - margins.labelMargin.bottom
            - margins.targetMargin.top - margins.targetMargin.bottom
            - calloutValueSpace
            - calloutPercentSpace;
    }

    /*
    * Get arcRadius and translation Data depending on start angle, endAngle of the arc and the height and
    * width of the frame in which to draw the arc.
    * Assumptions:
    * 1. Arc is drawn clockwise from startAngle to endAngle and should be centered in the frame.
    * 2. startAngle and endAngle are in radians and can be positive or negative.
    * 3. startAngle and endAngle canbe negative infinity to positive infinity.
    * 4. startAngle can be larger or smaller or equal to endAngle.
    */
    private calculateGaugeTranslation(axisData: TachometerAxisData, startAngle: number, endAngle: number, height: number, width: number): TachometerTranslationSettings {
        let startQuadrant: number = axisData.startQuadrant;
        let endQuadrant: number = axisData.endQuadrant;

        let sinAlpha: number = Math.abs(axisData.sinStartAngle);
        let sinBeta: number = Math.abs(axisData.sinEndAngle);
        let cosAlpha: number = Math.abs(axisData.cosStartAngle);
        let cosBeta: number = Math.abs(axisData.cosEndAngle);

        switch (startQuadrant) {
            case 1:
                return this.calculateGaugeTranslationQuadrant1(endQuadrant, height, width, startAngle, endAngle, sinAlpha, sinBeta, cosAlpha, cosBeta);
            case 2:
                return this.calculateGaugeTranslationQuadrant2(endQuadrant, height, width, startAngle, endAngle, sinAlpha, sinBeta, cosAlpha, cosBeta);
            case 3:
                return this.calculateGaugeTranslationQuadrant3(endQuadrant, height, width, startAngle, endAngle, sinAlpha, sinBeta, cosAlpha, cosBeta);
            case 4:
                return this.calculateGaugeTranslationQuadrant4(endQuadrant, height, width, startAngle, endAngle, sinAlpha, sinBeta, cosAlpha, cosBeta);
            default:
                // this should not be reached
                break;
        }
    }

    private calculateGaugeTranslationQuadrant1(endQuadrant: number, height: number, width: number, startAngle: number, endAngle: number, sinAlpha: number, sinBeta: number, cosAlpha: number, cosBeta: number): TachometerTranslationSettings {
        let radius: number;         // radius of arc
        let xOffset: number;        // translation along x axis
        let yOffset: number;        // translation along y axis
        let arcHeight: number;      // height of the arc along y axis
        let arcWidth: number;       // width of the arc along x axis
        let calloutyOffset: number; // Y offset of callout

        switch (endQuadrant) {
            case 1:
                if (cosAlpha > cosBeta) {
                    // start angle < end angle
                    radius = Math.min(width / sinBeta, height / cosAlpha);
                    arcHeight = radius * cosAlpha;
                    arcWidth = radius * sinBeta;
                    xOffset = width > arcWidth ? (width - arcWidth) / 2 : 0;
                    yOffset = height > arcHeight ? (height + arcHeight) / 2 : height;
                    calloutyOffset = yOffset;
                } else {
                    radius = Math.min(width / 2, height / 2);
                    xOffset = width / 2;
                    yOffset = height / 2;
                    calloutyOffset = yOffset + radius;
                }

                break;
            case 2:
                radius = Math.min(width, height / (cosAlpha + cosBeta));
                arcHeight = radius * (cosAlpha + cosBeta);
                xOffset = width > radius ? (width - radius) / 2 : 0;
                yOffset = height > arcHeight ? (height - arcHeight) / 2 + radius * cosAlpha : radius * cosAlpha;
                calloutyOffset = yOffset + radius * cosBeta;

                break;
            case 3:
                radius = Math.min(width / (1 + sinBeta), height / (1 + cosAlpha));
                arcHeight = radius + radius * cosAlpha;
                arcWidth = radius + radius * sinBeta;
                xOffset = width > arcWidth ? (width + arcWidth) / 2 - radius : width - radius;
                yOffset = height > arcHeight ? (height + arcHeight) / 2 - radius : height - radius;
                calloutyOffset = yOffset + radius;

                break;
            case 4:
                let max = Math.max(cosAlpha, cosBeta);

                radius = Math.min(width / 2, height / (1 + max));
                xOffset = width / 2;
                arcHeight = radius + radius * max;
                yOffset = height > arcHeight ? (height + arcHeight) / 2 - radius : height - radius;
                calloutyOffset = yOffset + radius;

                break;
            default:
                // this should not be reached
                break;
        }

        return {
            radius,
            startAngle,
            endAngle,
            xOffset,
            yOffset,
            calloutxOffset: width / 2,
            calloutyOffset: calloutyOffset
        };
    }

    private calculateGaugeTranslationQuadrant2(endQuadrant: number, height: number, width: number, startAngle: number, endAngle: number, sinAlpha: number, sinBeta: number, cosAlpha: number, cosBeta: number): TachometerTranslationSettings {
        let radius: number;         // radius of arc
        let xOffset: number;        // translation along x axis
        let yOffset: number;        // translation along y axis
        let arcHeight: number;      // height of the arc along y axis
        let arcWidth: number;       // width of the arc along x axis
        let calloutyOffset: number; // Y offset of callout

        switch (endQuadrant) {
            case 1:
                let max = Math.max(sinAlpha, sinBeta);

                radius = Math.min(width / (1 + max), height / 2);
                arcWidth = radius + radius * max;
                xOffset = width > arcWidth ? (width - arcWidth) / 2 + radius : radius;
                yOffset = height / 2;
                calloutyOffset = yOffset + radius;

                break;
            case 2:
                if (cosAlpha < cosBeta) {
                    // start angle < end angle
                    radius = Math.min(width / sinAlpha, height / cosBeta);
                    arcHeight = radius * cosBeta;
                    arcWidth = radius * sinAlpha;
                    xOffset = width > arcWidth ? (width - arcWidth) / 2 : 0;
                    yOffset = height > arcHeight ? (height - arcHeight) / 2 : 0;
                    calloutyOffset = yOffset + radius * cosBeta;
                } else {
                    radius = Math.min(width / 2, height / 2);
                    xOffset = width / 2;
                    yOffset = height / 2;
                    calloutyOffset = yOffset + radius;
                }

                break;
            case 3:
                let widthFator = sinAlpha + sinBeta;

                radius = Math.min(width / widthFator, height);
                arcHeight = radius;
                arcWidth = radius * widthFator;
                xOffset = width > arcWidth ? (width + arcWidth) / 2 - radius * sinAlpha : width - radius * sinAlpha;
                yOffset = height > arcHeight ? (height - arcHeight) / 2 : 0;
                calloutyOffset = yOffset + radius;

                break;
            case 4:
                radius = Math.min(width / (1 + sinAlpha), height / (1 + cosBeta));
                arcHeight = radius * (1 + cosBeta);
                arcWidth = radius * (1 + sinBeta);
                xOffset = width > arcWidth ? (width - arcWidth) / 2 + radius : radius;
                yOffset = height > arcHeight ? (height + arcHeight) / 2 - radius : height - radius;
                calloutyOffset = yOffset + radius;

                break;
            default:
                // this should not be reached
                break;
        }
        
        return {
            radius,
            startAngle,
            endAngle,
            xOffset,
            yOffset,
            calloutxOffset: width / 2,
            calloutyOffset: calloutyOffset
        };
    }

    private calculateGaugeTranslationQuadrant3(endQuadrant: number, height: number, width: number, startAngle: number, endAngle: number, sinAlpha: number, sinBeta: number, cosAlpha: number, cosBeta: number): TachometerTranslationSettings {
        let radius: number;         // radius of arc
        let xOffset: number;        // translation along x axis
        let yOffset: number;        // translation along y axis
        let arcHeight: number;      // height of the arc along y axis
        let arcWidth: number;       // width of the arc along x axis
        let calloutyOffset: number; // Y offset of callout

        switch (endQuadrant) {
            case 1:
                radius = Math.min(width / (1 + sinBeta), height / (1 + cosAlpha));
                arcHeight = radius + radius * cosAlpha;
                arcWidth = radius + radius * sinBeta;
                xOffset = width > arcWidth ? (width - arcWidth) / 2 + radius : radius;
                yOffset = height > arcHeight ? (height - arcHeight) / 2 + radius : radius;
                calloutyOffset = yOffset + radius * cosAlpha;

                break;
            case 2:
                radius = Math.min(width / 2, height / (1 + cosAlpha), height / (1 + cosBeta));
                xOffset = width / 2;
                arcHeight = radius + Math.max(radius * cosAlpha, radius * cosBeta);
                yOffset = height > arcHeight ? (height - arcHeight) / 2 + radius : radius;
                calloutyOffset = yOffset + radius * Math.max(cosAlpha, cosBeta);

                break;
            case 3:
                if (cosAlpha > cosBeta) {
                    // start angle < end angle
                    radius = Math.min(width / sinBeta, height / cosAlpha);
                    arcHeight = radius * cosAlpha;
                    arcWidth = radius * sinBeta;
                    xOffset = width > arcWidth ? (width + arcWidth) / 2 : width;
                    yOffset = height > arcHeight ? (height - arcHeight) / 2 : 0;
                    calloutyOffset = yOffset + radius * cosAlpha;
                } else {
                    radius = Math.min(width / 2, height / 2);
                    xOffset = width / 2;
                    yOffset = height / 2;
                    calloutyOffset = yOffset + radius;
                }

                break;
            case 4:
                radius = Math.min(width, height / (cosAlpha + cosBeta));
                arcHeight = radius * cosAlpha + radius * cosBeta;
                arcWidth = radius;
                xOffset = width > arcWidth ? (width + arcWidth) / 2 : width;
                yOffset = height > arcHeight ? (height - arcHeight) / 2 + radius * cosBeta : radius * cosBeta;
                calloutyOffset = yOffset + radius * cosAlpha;

                break;
            default:
                // this should not be reached
                break;
        }
        
        return {
            radius,
            startAngle,
            endAngle,
            xOffset,
            yOffset,
            calloutxOffset: width / 2,
            calloutyOffset: calloutyOffset
        };
    }

    private calculateGaugeTranslationQuadrant4(endQuadrant: number, height: number, width: number, startAngle: number, endAngle: number, sinAlpha: number, sinBeta: number, cosAlpha: number, cosBeta: number): TachometerTranslationSettings {
        let radius: number;         // radius of arc
        let xOffset: number;        // translation along x axis
        let yOffset: number;        // translation along y axis
        let arcHeight: number;      // height of the arc along y axis
        let arcWidth: number;       // width of the arc along x axis
        let calloutyOffset: number; // Y offset of callout

        switch (endQuadrant) {
            case 1:
                radius = Math.min(width / (sinAlpha + sinBeta), height);
                arcHeight = radius;
                arcWidth = radius * (sinAlpha + sinBeta);
                xOffset = width > arcWidth ? (width - arcWidth) / 2 + radius * sinAlpha : radius * sinAlpha;
                yOffset = height > arcHeight ? (height + arcHeight) / 2 : height;
                calloutyOffset = yOffset;

                break;
            case 2:
                radius = Math.min(width / (1 + sinAlpha), height / (1 + cosBeta));
                arcHeight = radius + radius * cosBeta;
                arcWidth = radius + radius * sinAlpha;
                xOffset = width > arcWidth ? (width + arcWidth) / 2 - radius : width - radius;
                yOffset = height > arcHeight ? (height - arcHeight) / 2 + radius : radius;
                calloutyOffset = yOffset + radius * cosBeta;

                break;
            case 3:
                radius = Math.min(width / (1 + Math.max(sinAlpha, sinBeta)), height / 2);
                arcWidth = radius + Math.max(radius * sinAlpha, radius * sinBeta);
                xOffset = width > arcWidth ? (width + arcWidth) / 2 - radius : width - radius;
                yOffset = height / 2;
                calloutyOffset = yOffset + radius;

                break;
            case 4:
                if (cosAlpha < cosBeta) {
                    // start angle < end angle
                    radius = Math.min(width / sinAlpha, height / cosBeta);
                    arcHeight = radius * cosBeta;
                    arcWidth = radius * sinAlpha;
                    xOffset = width > arcWidth ? (width + arcWidth) / 2 : width;
                    yOffset = height > arcHeight ? (height + arcHeight) / 2 : height;
                    calloutyOffset = yOffset;
                } else {
                    radius = Math.min(width / 2, height / 2);
                    xOffset = width / 2;
                    yOffset = height / 2;
                    calloutyOffset = yOffset + radius;
                }

                break;
            default:
                // this should not be reached
                break;
        }

        return {
            radius,
            startAngle,
            endAngle,
            xOffset,
            yOffset,
            calloutxOffset: width / 2,
            calloutyOffset: calloutyOffset
        };
    }

    private completeAxis(axisData: TachometerAxisData, translation: TachometerTranslationSettings): TachometerAxisData {
        let radius: number = translation.radius;

        let range1: TachometerRangeData = axisData.range1;
        let range2: TachometerRangeData = axisData.range2;
        let range3: TachometerRangeData = axisData.range3;
        let range4: TachometerRangeData = axisData.range4;
        let range5: TachometerRangeData = axisData.range5;
        let range6: TachometerRangeData = axisData.range6;
        let range7: TachometerRangeData = axisData.range7;

        let currentStart: number = axisData.startValue;
        let currentEnd: number = axisData.endValue;

        let boarders: number[] = [
            currentStart,
            range2.startValue,
            range3.startValue,
            range4.startValue,
            range5.startValue,
            range6.startValue,
            range7.startValue,
            currentEnd
        ];

        let currVal: number = currentEnd;

        for (let index: number = boarders.length - 1; index > 0; index--) {
            const element = boarders[index];

            if (!isFinite(element)) {
                boarders[index] = currVal;
            } else {
                currVal = element;
            }
        }

        range1.startValue = boarders[0];
        range1.endValue = range2.startValue = boarders[1];
        range2.endValue = range3.startValue = boarders[2];
        range3.endValue = range4.startValue = boarders[3];
        range4.endValue = range5.startValue = boarders[4];
        range5.endValue = range6.startValue = boarders[5];
        range6.endValue = range7.startValue = boarders[6];
        range7.endValue = boarders[7];

        axisData.range1 = this.completeAxisRange(axisData.range1, radius);
        axisData.range2 = this.completeAxisRange(axisData.range2, radius);
        axisData.range3 = this.completeAxisRange(axisData.range3, radius);
        axisData.range4 = this.completeAxisRange(axisData.range4, radius);
        axisData.range5 = this.completeAxisRange(axisData.range5, radius);
        axisData.range6 = this.completeAxisRange(axisData.range6, radius);
        axisData.range7 = this.completeAxisRange(axisData.range7, radius);

        axisData.radius = radius;
        axisData.axisLabelRadius = radius + this.gaugeStyle.labels.padding;

        let xOffset: number = translation.xOffset;
        let yOffset: number = translation.yOffset;

        axisData.offset.x = xOffset;
        axisData.offset.y = yOffset;
        axisData.transformString = translate(xOffset, yOffset);
        axisData.indicator = this.completeIndicator(axisData.indicator, translation, axisData.offset, axisData.value);
        axisData.target = this.completeTarget(axisData.target, axisData);

        return axisData;
    }

    private completeCallout(callout: TachometerCalloutSettings, translation: TachometerTranslationSettings): TachometerCalloutSettings {
        callout.baseOffset.x = translation.calloutxOffset;
        callout.baseOffset.y = translation.calloutyOffset;

        return callout;
    }

    private updateVisualRangeComponents(transformString: string, range: TachometerRangeData, rangeArc: d3.Arc<any, d3.DefaultArcObject>, arcPath: d3.Selection<d3.BaseType, any, any, any>) {
        rangeArc
            .innerRadius(range.innerRadius)
            .outerRadius(range.radius)
            .startAngle(range.startAngle)
            .endAngle(range.endAngle);

        arcPath
            .attr('d', rangeArc)
            .attr('transform', transformString)
            .style('fill', range.rangeColor);
    }

    private updateVisualComponents(viewModel: TachometerViewModel): void {
        let transformString = viewModel.axis.transformString;

        // Range 1
        this.updateVisualRangeComponents(transformString, viewModel.axis.range1, this.range1Arc, this.range1ArcPath);

        // Range 2
        this.updateVisualRangeComponents(transformString, viewModel.axis.range2, this.range2Arc, this.range2ArcPath);

        // Range 3
        this.updateVisualRangeComponents(transformString, viewModel.axis.range3, this.range3Arc, this.range3ArcPath);

        // Range 4
        this.updateVisualRangeComponents(transformString, viewModel.axis.range4, this.range4Arc, this.range4ArcPath);

        // Range 5
        this.updateVisualRangeComponents(transformString, viewModel.axis.range5, this.range5Arc, this.range5ArcPath);

        // Range 6
        this.updateVisualRangeComponents(transformString, viewModel.axis.range6, this.range6Arc, this.range6ArcPath);

        // Range 7
        this.updateVisualRangeComponents(transformString, viewModel.axis.range7, this.range7Arc, this.range7ArcPath);

        let indicator = viewModel.axis.indicator;

        this.needle
            .attr('d', Tachometer.LineFunction(indicator.needlePoints))
            .attr('transform', indicator.needletransformString)
            .style('stroke', indicator.pointerColor);

        let centerArc: d3.Arc<any, d3.DefaultArcObject> = this.centerArc;

        centerArc
            .innerRadius(indicator.baseInnerRadius)
            .outerRadius(indicator.baseRadius)
            .startAngle(indicator.baseStartAngle)
            .endAngle(indicator.baseEndtAngle);

        this.centerArcPath
            .attr('d', centerArc)
            .attr('transform', transformString)
            .style('fill', indicator.baseColor);
    }

    private updateCallout(viewModel: TachometerViewModel): void {
        let callout = viewModel.callout;
        let calloutValue = callout.calloutValue;
        let calloutPercent = callout.calloutPercent;
        let yOffsetBase = callout.baseOffset.y;
        let xOffsetBase = callout.baseOffset.x;

        if (this.showCalloutValue) {
            let value = calloutValue.formattedValue;

            let userYOffset = Tachometer.translateUserYOffset(yOffsetBase, calloutValue, viewModel.viewportHeight, this.gaugeStyle.callout.padding);
            let userXOffset = Tachometer.translateUserXOffset(xOffsetBase, calloutValue, viewModel.viewportWidth, calloutValue.textWidth, this.gaugeStyle.callout.padding);

            this.calloutRectangle = {
                left: xOffsetBase + userXOffset - calloutValue.textWidth / 2,
                top: yOffsetBase + userYOffset,
                right: xOffsetBase + userXOffset + calloutValue.textWidth / 2,
                bottom: yOffsetBase + userYOffset + calloutValue.textHeight,
            };

            if (this.isWithinBounds(this.calloutRectangle)) {
                this.calloutLabel
                    .attr('transform', translate(xOffsetBase + userXOffset, this.calloutRectangle.bottom))
                    .style('fill', calloutValue.labelColor)
                    .style('text-anchor', 'middle')
                    .style('font-size', calloutValue.fontSizePx)
                    .style('display', '')
                    .text(value);

                yOffsetBase = yOffsetBase + calloutValue.textHeight + this.gaugeStyle.callout.padding;

                // Set Base for CalloutPercent
                if (userYOffset < 0) {
                    yOffsetBase = Math.max(yOffsetBase + userYOffset, callout.baseOffset.y);
                }
            } else {
                this.calloutLabel
                    .style('display', 'none');
                this.calloutRectangle = null;
            }
        } else {
            this.calloutLabel
                .style('display', 'none');
            this.calloutRectangle = null;
        }

        if (this.showCalloutPercent) {
            let value = calloutPercent.formattedValue;
            let userYOffset = Tachometer.translateUserYOffset(yOffsetBase, calloutPercent, viewModel.viewportHeight, this.gaugeStyle.callout.padding);
            let userXOffset = Tachometer.translateUserXOffset(xOffsetBase, calloutPercent, viewModel.viewportWidth, calloutPercent.textWidth, this.gaugeStyle.callout.padding);

            this.calloutPercentRectangle = {
                left: xOffsetBase + userXOffset - calloutPercent.textWidth / 2,
                top: yOffsetBase + userYOffset,
                right: xOffsetBase + userXOffset + calloutPercent.textWidth / 2,
                bottom: yOffsetBase + userYOffset + calloutPercent.textHeight,
            };

            if (this.isOverlapping(this.calloutRectangle, this.calloutPercentRectangle) || !this.isWithinBounds(this.calloutPercentRectangle)) {
                this.calloutPercent
                    .style('display', 'none');
            } else {
                this.calloutPercent
                    .attr('transform', translate(xOffsetBase + userXOffset, this.calloutPercentRectangle.bottom))
                    .style('fill', calloutPercent.labelColor)
                    .style('text-anchor', 'middle')
                    .style('font-size', calloutPercent.fontSizePx)
                    .style('display', '')
                    .text(value);
            }
        } else {
            this.calloutPercent
                .style('display', 'none');

            this.calloutPercentRectangle = null;
        }
    }

    private createAxisLabels(): TachometerAxisLabel[] {
        if (this.showAxisLabels) {
            if (this.axisData.dataLabels.round) {
                return this.createNiceRoundLabels();
            } else {
                return this.createEquallySpacedLabels();
            }
        }

        return [];
    }

    private updateAxisLabelText(axis: TachometerAxisData, axisLabels: TachometerAxisLabel[]) {
        this.svg.selectAll(Tachometer.LabelText.selectorName).remove();

        if (!this.showAxisLabels) {
            return;
        }

        // seems to be incorrect and was discovered after changing all let to let
        // let axisLabels = this.axisLabels;

        let labelColor = axis.dataLabels.labelColor;
        let ticCount = axisLabels.length;
        let fontSizePx = axis.dataLabels.fontSizePx;

        if (this.showAxisLabels) {
            for (let count = 0; count < ticCount; count++) {
                let axisLabel: TachometerAxisLabel = axisLabels[count];

                let text = this.axisLabelsGraphicsContext
                    .append('text')
                    .attr('x', axisLabel.xOffset)
                    .attr('y', axisLabel.yOffset)
                    .attr('dy', 0)
                    .attr('class', Tachometer.LabelText.className)
                    .style('fill', labelColor)
                    .style('text-anchor', axisLabel.anchor)
                    .style('font-size', fontSizePx)
                    .text(axisLabel.displayValue)
                    .append('title').text(axisLabel.displayValue);

                this.truncateTextIfNeeded(text, axisLabel.xOffset, axisLabel.anchor === 'start');
                axisLabel.graphicsElement = text;
            }
        }
    }

    private updateTarget(viewModel: TachometerViewModel) {
        let target = viewModel.axis.target;

        if (target.show && isFinite(target.value)) {
            this.updateTargeIndicator(target);

            if (this.showTargetLabel) {
                this.updateTargetText(viewModel, this.axisLabels);
            } else {
                this.removeTargetElements(false);
            }
        } else {
            this.removeTargetElements(true);
        }
    }

    private resetTachometerData(): TachometerAxisData {
        let axisData: TachometerAxisData = this.axisData;

        axisData.startValue = Tachometer.UninitializedStartValue;
        axisData.endValue = Tachometer.UninitializedEndValue;
        axisData.value = undefined;
        axisData.tooltipInfo = [];
        axisData.valueRange = 0;
        axisData.range1.startValue = Tachometer.UnintializedRangeStartValue;
        axisData.range1.endValue = Tachometer.UninitializedEndValue;
        axisData.range2.startValue = Tachometer.UnintializedRangeStartValue;
        axisData.range2.endValue = Tachometer.UninitializedEndValue;
        axisData.range3.startValue = Tachometer.UnintializedRangeStartValue;
        axisData.range3.endValue = Tachometer.UninitializedEndValue;
        axisData.range4.startValue = Tachometer.UnintializedRangeStartValue;
        axisData.range4.endValue = Tachometer.UninitializedEndValue;
        axisData.range5.startValue = Tachometer.UnintializedRangeStartValue;
        axisData.range5.endValue = Tachometer.UninitializedEndValue;
        axisData.range6.startValue = Tachometer.UnintializedRangeStartValue;
        axisData.range6.endValue = Tachometer.UninitializedEndValue;
        axisData.range7.startValue = Tachometer.UnintializedRangeStartValue;
        axisData.range7.endValue = Tachometer.UninitializedEndValue;
        axisData.target.value = Tachometer.UninitializedStartValue;
        axisData.target.innerRadiusRatio = Tachometer.UninitializedRatio;

        return axisData;
    }

    private transformTachometerDataRoles(dataView: DataView, axisData: TachometerAxisData): TachometerAxisData {
        if (!dataView || !dataView.categorical || !dataView.categorical.values || !dataView.metadata || !dataView.metadata.columns) {
            return axisData;
        }

        let values: DataViewValueColumns = dataView.categorical.values;

        for (let i: number = 0; i < values.length; i++) {
            let col: DataViewMetadataColumn = values[i].source;

            if (!col || !col.roles) {
                continue;
            }

            let value: number = <number>values[i].values[0];

            value = value === null ? undefined : value;

            if (col.roles[Tachometer.RoleNames.y]) {
                if (value === undefined || isNaN(value)) {
                    axisData.value = Tachometer.UninitializedStartValue;
                } else {
                    axisData.value = value;

                    axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.y, value: value.toString() });
                }
            }

            if (col.roles[Tachometer.RoleNames.startValue]) {
                if (value === undefined || isNaN(value)) {
                    axisData.startValue = Tachometer.UninitializedStartValue;
                } else {
                    axisData.startValue = value;

                    axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.startValue, value: value.toString() });
                }
            }

            if (col.roles[Tachometer.RoleNames.endValue]) {
                if (value === undefined || isNaN(value)) {
                    axisData.endValue = Tachometer.UninitializedEndValue;
                } else {
                    axisData.endValue = value;

                    axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.endValue, value: value.toString() });
                }
            }

            if (col.roles[Tachometer.RoleNames.targetValue]) {
                if (value === undefined || isNaN(value)) {
                    axisData.target.value = Tachometer.UninitializedStartValue;
                } else {
                    axisData.target.value = value;

                    axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.targetValue, value: value.toString() });
                }
            }

            if (col.roles[Tachometer.RoleNames.displayFilter]) {
                if (value === undefined || isNaN(value) || value === 0) {
                    axisData.show = false;
                } else {
                    axisData.show = true;
                }
            }

            this.transformTachometerDataRoles2(axisData, col, value);
        }

        return axisData;
    }

    // Breaking up transformTachometerDataRoles to get around 100 line limit for certification.
    private transformTachometerDataRoles2(axisData: TachometerAxisData, col: DataViewMetadataColumn, value: number): void {
        if (col.roles[Tachometer.RoleNames.range2StartValue]) {
            if (value === undefined || isNaN(value)) {
                axisData.range2.startValue = Tachometer.UninitializedStartValue;
            } else {
                axisData.range2.startValue = value;

                axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.range2StartValue, value: value.toString() });
            }
        }

        if (col.roles[Tachometer.RoleNames.range3StartValue]) {
            if (value === undefined || isNaN(value)) {
                axisData.range3.startValue = Tachometer.UninitializedStartValue;
            } else {
                axisData.range3.startValue = value;

                axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.range3StartValue, value: value.toString() });
            }
        }

        if (col.roles[Tachometer.RoleNames.range4StartValue]) {
            if (value === undefined || isNaN(value)) {
                axisData.range4.startValue = Tachometer.UninitializedStartValue;
            } else {
                axisData.range4.startValue = value;

                axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.range4StartValue, value: value.toString() });
            }
        }

        if (col.roles[Tachometer.RoleNames.range5StartValue]) {
            if (value === undefined || isNaN(value)) {
                axisData.range5.startValue = Tachometer.UninitializedStartValue;
            } else {
                axisData.range5.startValue = value;

                axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.range5StartValue, value: value.toString() });
            }
        }

        if (col.roles[Tachometer.RoleNames.range6StartValue]) {
            if (value === undefined || isNaN(value)) {
                axisData.range6.startValue = Tachometer.UninitializedStartValue;
            } else {
                axisData.range6.startValue = value;

                axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.range6StartValue, value: value.toString() });
            }
        }

        if (col.roles[Tachometer.RoleNames.range7StartValue]) {
            if (value === undefined || isNaN(value)) {
                axisData.range7.startValue = Tachometer.UninitializedStartValue;
            } else {
                axisData.range7.startValue = value;

                axisData.tooltipInfo.push({ displayName: Tachometer.RoleNames.range7StartValue, value: value.toString() });
            }
        }
    }

    private transformTachometerSettings(dataView: DataView, axisData: TachometerAxisData, visualSettings: VisualSettings): TachometerAxisData {
        axisData = Tachometer.transformGaugeAxisSettings(dataView, axisData, visualSettings);

        if (visualSettings && visualSettings.rangeDefaults && visualSettings.rangeDefaults.colorScheme === ColorScheme.greenRedGreen) {
            axisData.range1 = Tachometer.transformRangeSettings(dataView, 'range1', axisData.range1, Tachometer.DefaultRange1ColorSchemeGrg, visualSettings && visualSettings.range1);
            axisData.range2 = Tachometer.transformRangeSettings(dataView, 'range2', axisData.range2, Tachometer.DefaultRange2ColorSchemeGrg, visualSettings && visualSettings.range2);
            axisData.range3 = Tachometer.transformRangeSettings(dataView, 'range3', axisData.range3, Tachometer.DefaultRange3ColorSchemeGrg, visualSettings && visualSettings.range3);
            axisData.range4 = Tachometer.transformRangeSettings(dataView, 'range4', axisData.range4, Tachometer.DefaultRange3ColorSchemeGrg, visualSettings && visualSettings.range4);
            axisData.range5 = Tachometer.transformRangeSettings(dataView, 'range5', axisData.range5, Tachometer.DefaultRange3ColorSchemeGrg, visualSettings && visualSettings.range5);
            axisData.range6 = Tachometer.transformRangeSettings(dataView, 'range6', axisData.range6, Tachometer.DefaultRange3ColorSchemeGrg, visualSettings && visualSettings.range6);
            axisData.range7 = Tachometer.transformRangeSettings(dataView, 'range7', axisData.range7, Tachometer.DefaultRange3ColorSchemeGrg, visualSettings && visualSettings.range7);
        } else {
            axisData.range1 = Tachometer.transformRangeSettings(dataView, 'range1', axisData.range1, Tachometer.DefaultRange1ColorSchemeRgr, visualSettings && visualSettings.range1);
            axisData.range2 = Tachometer.transformRangeSettings(dataView, 'range2', axisData.range2, Tachometer.DefaultRange2ColorSchemeRgr, visualSettings && visualSettings.range2);
            axisData.range3 = Tachometer.transformRangeSettings(dataView, 'range3', axisData.range3, Tachometer.DefaultRange3ColorSchemeRgr, visualSettings && visualSettings.range3);
            axisData.range4 = Tachometer.transformRangeSettings(dataView, 'range4', axisData.range4, Tachometer.DefaultRange3ColorSchemeRgr, visualSettings && visualSettings.range4);
            axisData.range5 = Tachometer.transformRangeSettings(dataView, 'range5', axisData.range5, Tachometer.DefaultRange3ColorSchemeRgr, visualSettings && visualSettings.range5);
            axisData.range6 = Tachometer.transformRangeSettings(dataView, 'range6', axisData.range6, Tachometer.DefaultRange3ColorSchemeRgr, visualSettings && visualSettings.range6);
            axisData.range7 = Tachometer.transformRangeSettings(dataView, 'range7', axisData.range7, Tachometer.DefaultRange3ColorSchemeRgr, visualSettings && visualSettings.range7);
        }

        axisData.dataLabels = Tachometer.transformDataLabelSettings(dataView, 'labels', Tachometer.getDefaultTachometerLabelSettings(), visualSettings && visualSettings.labels);

        let dataLabels = axisData.dataLabels;

        if (dataLabels.show) {
            let value = Math.max(Math.abs(axisData.startValue), Math.abs(axisData.endValue));
            let formatter = this.getFormatter(dataLabels.displayUnits, dataLabels.precision, value);
            let formattedValue = formatter.format(value);

            dataLabels.textWidth = Tachometer.getTextWidth(dataLabels.fontSizePx, formattedValue);
        }

        axisData.target = this.transformTargetSettings(dataView, axisData.target, axisData.dataLabels, visualSettings);
        axisData.indicator = Tachometer.transformIndicatorSettings(dataView, axisData.indicator, visualSettings);

        return axisData;
    }

    private static transformDataLabelSettings(dataView: DataView, objectName: string, dataLabelsSettings: TachometerDataLabelsData, settings: any): TachometerDataLabelsData {
        if (settings !== null && settings !== undefined) {
            if (settings.show !== null && settings.show !== undefined) {
                dataLabelsSettings.show = <boolean>settings.show;
            }

            if (settings.color !== null && settings.color !== undefined) {
                dataLabelsSettings.labelColor = settings.color;
            }

            if (settings.labelDisplayUnits !== null && settings.labelDisplayUnits !== undefined) {
                dataLabelsSettings.displayUnits = settings.labelDisplayUnits;
            }

            if (settings.labelPrecision !== null && settings.labelPrecision !== undefined) {
                dataLabelsSettings.precision = (settings.labelPrecision >= 0) ? settings.labelPrecision : dataLabelUtils.defaultLabelPrecision;
            }

            if (settings.fontSize !== null && settings.fontSize !== undefined) {
                dataLabelsSettings.fontSize = settings.fontSize;
                dataLabelsSettings.fontSizePx = PixelConverter.fromPoint(settings.fontSize);
                dataLabelsSettings.textHeight = PixelConverter.fromPointToPixel(settings.fontSize);
            }

            if (settings.count !== null && settings.count !== undefined) {
                dataLabelsSettings.count = settings.count;
            } else {
                dataLabelsSettings.count = Tachometer.DefaultLabelCount;
            }

            if (settings.round !== null && settings.round !== undefined) {
                dataLabelsSettings.round = settings.round;
            }

            if (settings.reduce !== null && settings.reduce !== undefined) {
                dataLabelsSettings.reduce = settings.reduce;
            }

            if (settings.xOffset !== null && settings.xOffset !== undefined) {
                dataLabelsSettings.offset.x = Tachometer.clamp(settings.xOffset, -100, 100);
            }

            if (settings.yOffset !== null && settings.yOffset !== undefined) {
                dataLabelsSettings.offset.y = Tachometer.clamp(-settings.yOffset, -100, 100); // switching direction for intutive user experience of +ve up
            }

            if (settings.invert !== null && settings.invert !== undefined) {
                dataLabelsSettings.invert = <boolean>settings.invert;
            }

            if (settings.percentType !== null && settings.percentType !== undefined) {
                dataLabelsSettings.percentType = settings.percentType;
            }
        } else {
            dataLabelsSettings.count = Tachometer.DefaultLabelCount;
        }

        return dataLabelsSettings;
    }

    private static getDefaultTachometerCalloutSettings(): TachometerDataLabelsData {
        return {
            show: true,
            fontSizePx: PixelConverter.fromPoint(Tachometer.DefaultCalloutFontSizeInPt),
            labelColor: null,
            displayUnits: 0,
            precision: dataLabelUtils.defaultLabelPrecision,
            fontSize: Tachometer.DefaultCalloutFontSizeInPt,
            offset: { x: 0, y: -10 },
            textHeight: PixelConverter.fromPointToPixel(Tachometer.DefaultCalloutFontSizeInPt)
        };
    }

    private getFormatter(displayUnits: number, precision: number, value?: number, ignoreDataType: boolean = false): IValueFormatter {
        displayUnits = displayUnits == null ? 0 : displayUnits;

        let realValue = displayUnits === 0 ? value : null;
        let formatString: string = ignoreDataType ?
            valueFormatter.getFormatString(null, Tachometer.formatStringProp) :
            valueFormatter.getFormatStringByColumn(this.metadataColumn);

        precision = dataLabelUtils.getLabelPrecision(precision, formatString);

        let valueFormatterOptions: ValueFormatterOptions = this.getOptionsForLabelFormatter(displayUnits, formatString, realValue, precision);

        return valueFormatter.create(valueFormatterOptions);
    }

    private static getTextWidth(fontSizePx: string, text: string) {
        let textProperties: TextProperties = {
            text: text,
            fontFamily: Tachometer.defaultLabelFontFamily,
            fontSize: fontSizePx,
            fontWeight: Tachometer.defaultLabelfontWeight,
        };

        return textMeasurementService.measureSvgTextWidth(textProperties);
    }

    private static getDefaultTachometerCalloutPercentSettings(): TachometerDataLabelsData {
        return {
            show: false,
            fontSizePx: PixelConverter.fromPoint(Tachometer.DefaultCalloutPercentFontSizeInPt),
            labelColor: '#333333',
            precision: dataLabelUtils.defaultLabelPrecision,
            fontSize: Tachometer.DefaultCalloutPercentFontSizeInPt,
            offset: { x: 0, y: -10 },
            textHeight: PixelConverter.fromPointToPixel(Tachometer.DefaultCalloutFontSizeInPt),
            invert: false,
            percentType: PercentType.endValue
        };
    }

    private getZeroMargin(): IMargin {
        return { 
            top: 0, 
            bottom: 0, 
            left: 0, 
            right: 0 
        };
    }

    private completeAxisRange(range: TachometerRangeData, radius: number): TachometerRangeData {
        range.radius = radius;
        range.innerRadius = radius * range.innerRadiusRatio;
        range.startAngle = this.axisScale(range.startValue);
        range.endAngle = this.axisScale(range.endValue);

        return range;
    }

    private completeIndicator(indicator: TachometerIndicatorData, translation: TachometerTranslationSettings, offset: Offset, value: number): TachometerIndicatorData {
        let radius = translation.radius;
        let baseArcRadiusFactor = Tachometer.BaseArcRadiusFactor / 100; // radius of indicator base arc with respect to the dial radius

        let baseArcRadius = radius * baseArcRadiusFactor;
        let baseArcInnerRadius = baseArcRadius * indicator.baseThicknessFactor;

        let needleTip = -radius * indicator.pointerSizeFactor;
        let needleBase = -(baseArcRadius + baseArcInnerRadius) / 2;
        let needleHeight = needleTip - needleBase;
        let halfNeedleWidth = needleHeight * Tachometer.NeedleHeightToWidthRatio / 2;

        let needleAngleInDegrees: number = (isFinite(value) ? this.axisScale(value) : this.axisScale.domain()[0])
            * Tachometer.RadToDegreeConversionFactor;

        indicator.baseRadius = baseArcRadius;
        indicator.baseInnerRadius = baseArcInnerRadius;
        indicator.value = value;
        indicator.baseStartAngle = translation.startAngle;
        indicator.baseEndtAngle = translation.endAngle;
        indicator.needletransformString = translateAndRotate(offset.x, offset.y, 0, 0, needleAngleInDegrees);

        indicator.needlePoints = [
            { 'x': -halfNeedleWidth, 'y': needleBase },
            { 'x': 0, 'y': needleTip },
            { 'x': halfNeedleWidth, 'y': needleBase },
            { 'x': -halfNeedleWidth, 'y': needleBase },
        ];

        return indicator;
    }

    private completeTarget(target: TachometerTargetData, axisData: TachometerAxisData): TachometerTargetData {
        target.radius = axisData.radius;

        target.innerRadius = target.innerRadiusRatio === Tachometer.UninitializedRatio
            ? Math.max(axisData.range1.innerRadius, axisData.range2.innerRadius, axisData.range3.innerRadius, axisData.range4.innerRadius, axisData.range5.innerRadius, axisData.range6.innerRadius, axisData.range7.innerRadius)
            : target.radius * target.innerRadiusRatio;

        target.innerRadius = Tachometer.clamp(target.innerRadius, axisData.indicator.baseRadius, axisData.radius);
        target.offset.x = axisData.offset.x;
        target.offset.y = axisData.offset.y;

        return target;
    }

    // Convert the percent value of offset into a pixel value
    private static translateUserXOffset(baseXOffset: number, callout: TachometerDataLabelsData, width: number, textWidth: number, padding: number): number {
        let xOffsetPercent = callout.offset.x;

        if (xOffsetPercent !== 0) {
            // we have width /2 on either side
            let userXOffset = xOffsetPercent / 200 * (width - textWidth - 2 * padding);
            let threshold: number = textWidth / 2 + padding;
            let offset = baseXOffset + userXOffset;

            // return the offset from the base offet
            return offset < threshold
                ? threshold - baseXOffset // too far left
                : offset > width - threshold
                    ? width - threshold - baseXOffset // too far right so clamp it
                    : userXOffset;
        }

        return 0;
    }

    private isWithinBounds(rectangle: TachometerRectangle): boolean {
        return (rectangle != null) && ((rectangle.left > 0) && (rectangle.right < this.currentViewport.width) && (rectangle.top > 0) && (rectangle.bottom < this.currentViewport.height));
    }

    // Return true if the two labels defined by
    private isOverlapping(rect1: TachometerRectangle, rect2: TachometerRectangle): boolean {
        if (!rect1 || !rect2) {
            return false;
        }

        let left = rect1.left - Tachometer.OverlapTolerance;
        let right = rect1.right + Tachometer.OverlapTolerance;
        let top = rect1.top - Tachometer.OverlapTolerance;
        let bottom = rect1.bottom + Tachometer.OverlapTolerance;

        return !(((left >= rect2.left && right >= rect2.left) && (left >= rect2.right && right >= rect2.right))
            || ((left <= rect2.left && right <= rect2.left) && (left <= rect2.right && right <= rect2.right))
            || ((top >= rect2.top && bottom >= rect2.top) && (top >= rect2.bottom && bottom >= rect2.bottom))
            || ((top <= rect2.top && bottom <= rect2.top) && (top <= rect2.bottom && bottom <= rect2.bottom)));
    }

    private isOverlappingWithCallout(rectangle: TachometerRectangle) {
        return this.isOverlapping(rectangle, this.calloutRectangle) || this.isOverlapping(rectangle, this.calloutPercentRectangle);
    }

    private createNiceRoundLabels(): TachometerAxisLabel[] {
        let axisLabels: TachometerAxisLabel[] = [];
        let axisData = this.axisData;
        let dataLabels: TachometerDataLabelsData = axisData.dataLabels;

        // Show only the start and end values
        let ticCount = (Math.abs(axisData.valueRange) > 1) ? dataLabels.count : 1;

        if (ticCount > 0) {
            let ticks: number[] = this.axisScale.ticks(ticCount);

            // This is the real tic count when this.data.dataLabelsSettings.round = true
            ticCount = ticks.length;

            let radius = this.axisData.radius;
            let fontSizePx = dataLabels.fontSizePx;
            let textHeight = PixelConverter.fromPointToPixel(dataLabels.fontSize);

            // initialize to a very small number
            let lastAngle: number = Tachometer.UninitializedStartValue;
            let reduce = dataLabels.reduce;
            let lastDisplayValue = '';
            let lastAxisLabel: TachometerAxisLabel;

            for (let i: number = 0; i < ticCount; i++) {
                let value = ticks[i];
                let angle = this.axisScale(value);
                let currentDisplayValue = dataLabels.formatter.format(value);

                if (((!reduce || (Math.abs(lastAngle - angle) * radius) >= Tachometer.MinLabelDistance)) && (lastDisplayValue !== currentDisplayValue)) {
                    // second check is to avoid overcrowding with labels
                    // third check is to avoid repeating labels when they become rounded by Display Units
                    let axisLabel: TachometerAxisLabel = this.createAxisLabel(currentDisplayValue, value, fontSizePx, textHeight, angle);

                    if (this.isWithinBounds(axisLabel.rect) && (!lastAxisLabel || (lastAxisLabel && !this.isOverlapping(lastAxisLabel.rect, axisLabel.rect)))
                        && !this.isOverlappingWithCallout(axisLabel.rect)) {
                        axisLabels.push(axisLabel);
                        lastAngle = angle;
                        lastDisplayValue = currentDisplayValue;
                        lastAxisLabel = axisLabel;
                    }
                }
            }
        }

        return axisLabels;
    }

    private createEquallySpacedLabels(): TachometerAxisLabel[] {
        let axisLabels: TachometerAxisLabel[] = [];
        let axisData = this.axisData;
        let dataLabels: TachometerDataLabelsData = this.axisData.dataLabels;

        // Show only the start and end values
        let numberOfSteps = (Math.abs(axisData.valueRange) > 1) ? dataLabels.count - 1 : 1;

        if (numberOfSteps > 0) {
            let startAngle = axisData.startAngle;
            let angleStep = axisData.angleRange / numberOfSteps;
            let fontSizePx = dataLabels.fontSizePx;
            let textHeight = PixelConverter.fromPointToPixel(dataLabels.fontSize);
            let lastDisplayValue = '';
            let lastAxisLabel: TachometerAxisLabel;

            for (let i: number = 0; i <= numberOfSteps; i++) {
                let angle = startAngle + (i * angleStep);
                let value = this.axisScale.invert(angle);
                let currentDisplayValue = dataLabels.formatter.format(value);

                if (lastDisplayValue !== currentDisplayValue) {
                    // to avoid repeating labels when they become rounded by Display Units
                    let axisLabel = this.createAxisLabel(dataLabels.formatter.format(value), value, fontSizePx, textHeight, angle);

                    if (this.isWithinBounds(axisLabel.rect) && 
                        (!lastAxisLabel || (lastAxisLabel && !this.isOverlapping(lastAxisLabel.rect, axisLabel.rect))) && !this.isOverlappingWithCallout(axisLabel.rect)) {
                        axisLabels.push(axisLabel);
                        lastDisplayValue = currentDisplayValue;
                        lastAxisLabel = axisLabel;
                    }
                }
            }
        }

        return axisLabels;
    }

    private truncateTextIfNeeded(text: d3.Selection<d3.BaseType, any, any, any>, positionX: number, onRightSide: boolean) {
        let availableSpace = (onRightSide ? this.currentViewport.width - positionX : positionX);

        text.call(LabelLayoutStrategy.clip, availableSpace, textMeasurementService.svgEllipsis);
    }

    private updateTargeIndicator(target: TachometerTargetData) {
        let offset = target.offset;
        let radius = target.radius;
        let innerRadius = target.innerRadius;

        if (!this.targetIndicator) {
            this.targetIndicator = this.mainGraphicsContext.append('path');

            this.targetIndicator
                .classed('targetIndicator', true)
                .attr('stroke-width', Tachometer.DefaultStyleProperties.targetLine.thickness)
                .attr('fill', 'none');
        }

        let targetIndicatorPath = [
            { 'x': 0, 'y': -radius },
            { 'x': 0, 'y': -innerRadius }
        ];

        let angleInDegrees = this.axisScale(target.value) * Tachometer.RadToDegreeConversionFactor;

        this.targetIndicator
            .attr('d', Tachometer.LineFunction(targetIndicatorPath))
            .attr('transform', translateAndRotate(offset.x, offset.y, 0, 0, angleInDegrees))
            .style('stroke', target.lineColor);
    }

    private updateTargetText(viewModel: TachometerViewModel, axisLabels: TachometerAxisLabel[]) {
        let axis = viewModel.axis; let target = axis.target; let targetValue = target.value; let center = axis.offset; let radius = axis.radius;

        let targetAngle: number = this.axisScale(targetValue); let sinAngle = Math.sin(targetAngle); let cosAngle = Math.cos(targetAngle);

        let targetDetails: TargetDetails = {
            tipX: center.x + radius * sinAngle,
            tipY: center.y - radius * cosAngle,
            centerX: center.x,
            centerY: center.y,
            defaultTextAnchorX: center.x + axis.axisLabelRadius * sinAngle,
            defaultTextAnchorY: center.y - axis.axisLabelRadius * cosAngle,
            gaugeRadius: radius,
            labelRadius: axis.axisLabelRadius,
            onRightSide: sinAngle > 0,
            onTopHalf: cosAngle > 0,
            targetAngle: targetAngle
        };

        let targetRectangle = this.getTargetRectangle(axis, axisLabels, targetDetails);

        let anchor: string; let anchorOffset: Offset = { x: 0, y: 0 }; let connecterAnchor: Offset = { x: 0, y: 0 };

        if (targetRectangle == null) {
            // unable to place target
            this.showTargetLabel = false;
        } else {
            if (targetDetails.onRightSide) {
                anchor = 'start';
                anchorOffset.x = targetRectangle.left;
            } else {
                anchor = 'end';
                anchorOffset.x = targetRectangle.right;
            }

            anchorOffset.y = targetRectangle.bottom;

            // get nearest x between left, middle and right
            let targetCenterX = (targetRectangle.left + targetRectangle.right) / 2;
            let closestEdgeX = Math.abs(targetDetails.tipX - targetRectangle.left) > Math.abs(targetDetails.tipX - targetRectangle.right) ? targetRectangle.right : targetRectangle.left;

            connecterAnchor.x = Math.abs(targetDetails.tipX - closestEdgeX) > Math.abs(targetDetails.tipX - targetCenterX) ? targetCenterX : closestEdgeX;

            // get the nearest y between top, bottom and middle
            let targetCenterY = (targetRectangle.top + targetRectangle.bottom) / 2;

            // else: Settled for bottom - font size by experimentation
            let closestEdgeY = Math.abs(targetDetails.tipY - targetRectangle.top) > Math.abs(targetDetails.tipY - targetRectangle.bottom) ? targetRectangle.bottom : targetRectangle.bottom - target.fontSize;

            connecterAnchor.y = Math.abs(targetDetails.tipY - closestEdgeY) > Math.abs(targetDetails.tipY - targetCenterY) ? targetCenterY : closestEdgeY;
        }

        if (!this.targetText) {
            this.targetText = this.mainGraphicsContext
                .append('text')
                .classed(Tachometer.TargetText.className, true);
        }

        this.targetText
            .attr('x', anchorOffset.x)
            .attr('y', anchorOffset.y)
            .style('fill', target.textColor)
            .style('text-anchor', anchor)
            .style('display', this.showTargetLabel ? '' : 'none')
            .style('font-size', target.fontSizePx)
            .text(target.formattedValue);

        this.truncateTextIfNeeded(this.targetText, anchorOffset.x, targetDetails.onRightSide);

        // Hide the target connector if the text is going to align with the target line in the arc
        // It should only be shown if the target text is displaced (ex. when the target is very close to start/end)
        if (this.showTargetLabel) {
            if (!this.targetConnector) {
                this.targetConnector = this.mainGraphicsContext
                    .append('line')
                    .classed(Tachometer.TargetConnector.className, true);
            }

            let targetConnectorX = connecterAnchor.x - targetDetails.tipX;
            let targetConnectorY = connecterAnchor.y - targetDetails.tipY;
            let targetConnectorLength = Math.sqrt(targetConnectorX * targetConnectorX + targetConnectorY * targetConnectorY);

            if (targetConnectorLength - this.gaugeStyle.labels.padding < 1) {
                this.targetConnector.style('display', 'none');
            } else {
                this.targetConnector
                    .attr('x1', targetDetails.tipX)
                    .attr('y1', targetDetails.tipY)
                    .attr('x2', connecterAnchor.x)
                    .attr('y2', connecterAnchor.y)
                    .style('stroke-width', target.thickness)
                    .style('stroke', target.lineColor)
                    .style('opacity', 0.1)
                    .style('fill-opacity', 0)
                    .style('display', '');
            }
        } else if (this.targetConnector != null) {
            this.targetConnector.style('display', 'none');
        }
    }

    private removeTargetElements(removeAll: boolean) {
        if ((removeAll) && (this.targetIndicator)) {
            this.targetIndicator.remove();
            this.targetIndicator = null;
        }

        if (this.targetConnector) {
            this.targetText.remove();
            this.targetConnector.remove();
            this.targetConnector = this.targetText = null;
        }
    }

    private static transformGaugeAxisSettings(dataView: DataView, axisData: TachometerAxisData, visualSettings: VisualSettings): TachometerAxisData {
        // Override settings according to property pane axis values
        let axisVisualSettings = visualSettings.axis;

        axisData.startAngle = TachometerUtilities.isNumeric(axisVisualSettings.startAngle) ? (axisVisualSettings.startAngle * Tachometer.DegreeToRadConversionFactor) : Tachometer.UnintializedStartAngle;
        axisData.endAngle = TachometerUtilities.isNumeric(axisVisualSettings.endAngle) ? (axisVisualSettings.endAngle * Tachometer.DegreeToRadConversionFactor) : Tachometer.UnintializedEndAngle;

        if (TachometerUtilities.isNumeric(axisVisualSettings.endAngle)) {
            axisData.endAngle = (axisVisualSettings.endAngle * Tachometer.DegreeToRadConversionFactor);
        }

        if (axisVisualSettings.axisScaleType) {
            axisData.axisScaleType = axisVisualSettings.axisScaleType;
        }

        if (TachometerUtilities.isNumeric(axisVisualSettings.startValue)) {
            axisData.startValue = axisVisualSettings.startValue;
        }

        if (TachometerUtilities.isNumeric(axisVisualSettings.endValue)) {
            axisData.endValue = axisVisualSettings.endValue;
        }

        let startAngle: number = Tachometer.normalizeAngle(axisData.startAngle);
        let endAngle: number = Tachometer.normalizeAngle(axisData.endAngle);

        if (startAngle > endAngle) {
            // convert from a circular scale to a linear scale for simplicity
            endAngle = endAngle + Tachometer.TwoPI;
        }

        axisData.startAngle = startAngle;
        axisData.endAngle = endAngle;
        axisData.angleRange = axisData.endAngle - axisData.startAngle;

        let startValue = isFinite(axisData.startValue) ? axisData.startValue : Tachometer.DefaultMin;
        let value = isFinite(axisData.value) ? axisData.value : undefined;
        let endValue = isFinite(axisData.endValue) ? axisData.endValue : (isFinite(axisData.value) ? axisData.value * 2 : Tachometer.DefaultMax);

        if (startValue === 0 && endValue === 0) {
            endValue = 1;
        }

        axisData.value = value;
        axisData.endValue = endValue;
        axisData.startValue = startValue;
        axisData.valueRange = endValue - startValue;

        // Checking that the value is plotted inside the tachometer boundaries
        let baseValue: number = Math.min(endValue, startValue);
        let percent: number = axisData.valueRange !== 0 ? Math.abs((axisData.value - baseValue) * 100 / (axisData.valueRange)) : 0;

        axisData.percent = percent;

        axisData.directionClockwise = (axisData.endValue - axisData.startValue >= 0);
        axisData.startQuadrant = Tachometer.getQuadrant(startAngle);
        axisData.endQuadrant = Tachometer.getQuadrant(endAngle);
        axisData.cosStartAngle = Math.cos(startAngle);
        axisData.cosEndAngle = Math.cos(endAngle);
        axisData.sinStartAngle = Math.sin(startAngle);
        axisData.sinEndAngle = Math.sin(endAngle);

        return axisData;
    }

    private enumerateMarginProperties(enumeration: VisualObjectInstance[]): void {
        const marginVisualSettings: MarginVisualSettings = this.viewModel && this.viewModel.settings && this.viewModel.settings.margins;

        let instance: VisualObjectInstance = {
            objectName: "margins",
            displayName: "Margins",
            properties: {},
            selector: null,
        };

        let hasVisualSettings: boolean = marginVisualSettings != null;

        let marginSettings: IMargin = this.getTachometerMarginSettings();

        instance.properties['top'] = hasVisualSettings ? marginVisualSettings.top : marginSettings.top;
        instance.properties['bottom'] = hasVisualSettings ? marginVisualSettings.bottom : marginSettings.bottom;
        instance.properties['left'] = hasVisualSettings ? marginVisualSettings.left : marginSettings.left;
        instance.properties['right'] = hasVisualSettings ? marginVisualSettings.right : marginSettings.right;

        enumeration.push(instance);
    }

    private getTachometerMarginSettings() {
        return this.marginSettings;
    }

    private static transformRangeSettings(dataView: DataView, rangeName: string, rangeSettings: TachometerRangeData, defaultRangeColor: string, rangeVisualSettings: RangeVisualSettings): TachometerRangeData {
        let thickness: number;

        if (rangeVisualSettings !== undefined && rangeVisualSettings !== null) {
            // !isFinite(rangeSettings.startValue)  means that the value is not defined in field wells
            if ((!isFinite(rangeSettings.startValue) || rangeSettings.startValue === undefined)
                && (rangeVisualSettings.startValue !== undefined && rangeVisualSettings.startValue !== null)) {
                rangeSettings.startValue = rangeVisualSettings.startValue;
            }

            if (rangeVisualSettings.rangeColor && rangeVisualSettings.rangeColor !== undefined && rangeVisualSettings.rangeColor !== null) {
                rangeSettings.rangeColor = rangeVisualSettings.rangeColor;
            } else {
                rangeSettings.rangeColor = defaultRangeColor;
            }

            if (rangeVisualSettings.thickness && rangeVisualSettings.thickness !== undefined && rangeVisualSettings.thickness !== null) {
                thickness = rangeVisualSettings.thickness;
                thickness = Tachometer.clamp(thickness, 0, 100);

                // We want to set this to clamped value for enumeration
                rangeVisualSettings.thickness = thickness;
            } else {
                thickness = Tachometer.DefaultRangeThickness;
            }
        } else {
            rangeSettings.rangeColor = defaultRangeColor;

            thickness = Tachometer.DefaultRangeThickness;
        }

        rangeSettings.innerRadiusRatio = 1 - thickness / 100;

        return rangeSettings;
    }

    private transformMarginSettings(dataView: DataView, visualSettings: VisualSettings): IMargin {
        let hasVisualSettings: MarginVisualSettings = visualSettings && visualSettings.margins;

        let marginSettings: IMargin = this.getTachometerMarginSettings();

        if (hasVisualSettings) {
            if (hasVisualSettings.top !== undefined) {
                hasVisualSettings.top = Tachometer.clamp(hasVisualSettings.top, 0, Tachometer.MaxMarginSize);
                marginSettings.top = hasVisualSettings.top;
            }

            if (hasVisualSettings.bottom !== undefined) {
                hasVisualSettings.bottom = Tachometer.clamp(hasVisualSettings.bottom, 0, Tachometer.MaxMarginSize);
                marginSettings.bottom = hasVisualSettings.bottom;
            }

            if (hasVisualSettings.left !== undefined) {
                hasVisualSettings.left = Tachometer.clamp(hasVisualSettings.left, 0, Tachometer.MaxMarginSize);
                marginSettings.left = hasVisualSettings.left;
            }

            if (hasVisualSettings.right !== undefined) {
                hasVisualSettings.right = Tachometer.clamp(hasVisualSettings.right, 0, Tachometer.MaxMarginSize);
                marginSettings.right = hasVisualSettings.right;
            }
        }

        return marginSettings;
    }

    private static getDefaultTachometerLabelSettings(): TachometerDataLabelsData {
        return {
            show: true,
            fontSizePx: PixelConverter.fromPoint(Tachometer.defaultLabelFontSizeInPt),
            labelColor: null,
            displayUnits: 0,
            precision: dataLabelUtils.defaultLabelPrecision,
            fontSize: Tachometer.defaultLabelFontSizeInPt,
            round: true,
            count: undefined,

            // avoid overcrowding labels when log scale is used
            reduce: true,

            offset: { x: 0, y: 0 },
            formatter: undefined,
            invert: undefined,
            percentType: undefined,
            formattedValue: undefined,
            textWidth: undefined,

            textHeight: PixelConverter.fromPointToPixel(Tachometer.defaultLabelFontSizeInPt) + Tachometer.DefaultStyleProperties.labels.padding
        };
    }

    private transformTargetSettings(dataView: DataView, targetSettings: TachometerTargetData, dataLabels: TachometerDataLabelsData, visualSettings: VisualSettings): TachometerTargetData {
        let target: TargetVisualSettings = visualSettings.target;

        if (target) {
            if (target.show !== undefined) {
                targetSettings.show = <boolean>target.show;
            }

            if (targetSettings.value === Tachometer.UninitializedStartValue && target.value !== undefined) {
                // This basically means that the value is not defined in field wells
                targetSettings.value = target.value;
            }

            if (target.lineColor && target.lineColor !== undefined) {
                targetSettings.lineColor = target.lineColor;
            } else {
                targetSettings.lineColor = Tachometer.defaultTargetSettings.lineColor;
            }

            if (target.innerRadiusRatio && target.innerRadiusRatio !== undefined) {
                targetSettings.innerRadiusRatio = 1 - (target.innerRadiusRatio) / 100;
            } else {
                targetSettings.innerRadiusRatio = Tachometer.defaultTargetSettings.innerRadiusRatio;
            }

            if (target.textColor && target.textColor !== undefined) {
                targetSettings.textColor = target.textColor;
            } else {
                targetSettings.textColor = Tachometer.defaultTargetSettings.textColor;
            }

            if (target.fontSize && target.fontSize !== undefined) {
                targetSettings.fontSize = target.fontSize;
            } else {
                targetSettings.fontSize = Tachometer.defaultTargetSettings.fontSize;
            }
        } else {
            targetSettings.show = Tachometer.defaultTargetSettings.show;

            if (targetSettings.value === Tachometer.UninitializedStartValue) {
                // This basically means that the value is not defined in field wells
                targetSettings.value = Tachometer.defaultTargetSettings.value;
            }

            targetSettings.lineColor = Tachometer.defaultTargetSettings.lineColor;
            targetSettings.innerRadiusRatio = Tachometer.defaultTargetSettings.innerRadiusRatio;
            targetSettings.innerRadius = Tachometer.defaultTargetSettings.innerRadius;
            targetSettings.textColor = Tachometer.defaultTargetSettings.textColor;
            targetSettings.fontSize = Tachometer.defaultTargetSettings.fontSize;
        }

        if (targetSettings.show) {
            targetSettings.fontSizePx = PixelConverter.fromPoint(targetSettings.fontSize);
            targetSettings.textHeight = PixelConverter.fromPointToPixel(targetSettings.fontSize);
        }

        return targetSettings;
    }

    private static transformIndicatorSettings(dataView: DataView, indicatorData: TachometerIndicatorData, visualSettings: VisualSettings): TachometerIndicatorData {
        let hasVisualSettings: IndicatorVisualSettings = visualSettings.indicator;

        if (hasVisualSettings) {
            if (hasVisualSettings.pointerSizeFactor && hasVisualSettings.pointerSizeFactor !== undefined) {
                let thickness: number = Tachometer.clamp(hasVisualSettings.pointerSizeFactor, 0, 100);

                // We want to set this to clamped value for enumeration
                hasVisualSettings.pointerSizeFactor = thickness;
                indicatorData.pointerSizeFactor = thickness / 100;
            } else {
                indicatorData.pointerSizeFactor = Tachometer.defaultIndicatorSettings.pointerSizeFactor;
            }

            if (hasVisualSettings.pointerColor && hasVisualSettings.pointerColor !== undefined) {
                indicatorData.pointerColor = hasVisualSettings.pointerColor;
            } else {
                indicatorData.pointerColor = Tachometer.defaultIndicatorSettings.pointerColor;
            }

            if (hasVisualSettings.baseThicknessFactor && hasVisualSettings.baseThicknessFactor !== undefined) {
                let thickness: number = Tachometer.clamp(hasVisualSettings.baseThicknessFactor, 0, 100);

                // We want to set this to clamped value for enumeration
                hasVisualSettings.baseThicknessFactor = thickness;
                indicatorData.baseThicknessFactor = 1 - thickness / 100;
            } else {
                indicatorData.baseThicknessFactor = Tachometer.defaultIndicatorSettings.baseThicknessFactor;
            }

            if (hasVisualSettings.baseColor && hasVisualSettings.baseColor !== undefined) {
                indicatorData.baseColor = hasVisualSettings.baseColor;
            } else {
                indicatorData.baseColor = Tachometer.defaultIndicatorSettings.baseColor;
            }
        } else {
            indicatorData.pointerSizeFactor = Tachometer.defaultIndicatorSettings.pointerSizeFactor;
            indicatorData.pointerColor = Tachometer.defaultIndicatorSettings.pointerColor;
            indicatorData.baseThicknessFactor = Tachometer.defaultIndicatorSettings.baseThicknessFactor;
            indicatorData.baseColor = Tachometer.defaultIndicatorSettings.baseColor;
        }

        return indicatorData;
    }

    // clamp values between min and max, not using scales due to overhead
    private static clamp(value: number, min: number, max: number): number {
        if (value > max) {
            // clamp upper limit
            return max;
        } else if (value < min) {
            return min;
        }

        return value;
    }


    private getOptionsForLabelFormatter(displayUnits: number, formatString: string, value2?: number, precision?: number): ValueFormatterOptions {
        return {
            displayUnitSystemType: DisplayUnitSystemType.DataLabels,
            format: formatString,
            precision: precision,
            value: displayUnits,
            value2: value2,
            allowFormatBeautification: true
        };
    }

    private createAxisLabel(displayValue: string, value: number, textSizePx: string, fontHeight: number, angle: number): TachometerAxisLabel {
        let axis = this.axisData;
        let radius = axis.axisLabelRadius;
        let xOffset = axis.offset.x;
        let yOffset = axis.offset.y;

        let sinAngle = Math.sin(angle);
        let cosAngle = Math.cos(angle);
        let onBottomHalf = cosAngle < 0;
        let ticX = xOffset + radius * sinAngle;
        let ticY = yOffset - (radius + (onBottomHalf ? fontHeight : 0)) * cosAngle;

        // Is the target on left side or right side of verticle?
        let onRightSide: boolean = sinAngle > 0;
        let textWidth = Tachometer.getTextWidth(textSizePx, displayValue);

        let rect: TachometerRectangle = {
            // gauranteed that x1 < x2 for simplified processing later
            left: onRightSide ? ticX : ticX - textWidth,
            // gauranteed that y1 < y2 for simplified processing later
            top: ticY - fontHeight,
            right: onRightSide ? ticX + textWidth : ticX,
            bottom: ticY
        };

        return {
            show: true,
            displayValue: displayValue,
            value: value,
            angle: angle,
            anchor: onRightSide ? 'start' : 'end',
            xOffset: ticX,
            yOffset: ticY,
            textWidth: textWidth,
            textHeight: fontHeight,
            rect: rect,
            graphicsElement: null
        };
    }

    // Get the rectangle area where target value can be placed
    private getTargetRectangle(axis: TachometerAxisData, axisLabels: TachometerAxisLabel[], targetDetails: TargetDetails): TachometerRectangle {
        let target = axis.target;
        let targetValue = target.value;

        // Is the target on left side or right side of verticle?
        let targetTextWidth = target.textWidth;
        let targetTextHeight = target.textHeight;
        let targetPlaced: boolean = false;

        let targetRect: TachometerRectangle = {
            // make sure that aways x1 < x2 and y1 < y2 for simplified processing
            left: targetDetails.onRightSide ? targetDetails.defaultTextAnchorX : targetDetails.defaultTextAnchorX - targetTextWidth,
            top: targetDetails.onTopHalf ? targetDetails.defaultTextAnchorY - targetTextHeight : targetDetails.defaultTextAnchorY,
            right: targetDetails.onRightSide ? targetDetails.defaultTextAnchorX + target.textWidth : targetDetails.defaultTextAnchorX,
            bottom: targetDetails.onTopHalf ? targetDetails.defaultTextAnchorY : targetDetails.defaultTextAnchorY + target.textHeight
        };

        let tickCount = axisLabels.length;

        if (tickCount > 0) {
            // 1. identify where the target label will be located
            //    a linear search is fine because the number of axis labels are limited to a handful in the most common scenario
            let i: number = 0;

            for (let j: number = i + 1; j < tickCount; i++ , j++) {
                if (this.isBetween(targetValue, axisLabels[i].value, axisLabels[j].value)) {
                    // 2. Check if the target label can be placed between adjascent axis labels without overlapping
                    targetRect = this.placeTargetBetweenLabels(axisLabels[i].rect, axisLabels[j].rect, targetRect, targetDetails);
                    targetPlaced = true;

                    // match found
                    break;
                }
            }
            if (!targetPlaced) {
                let startIndex: number;
                let endIndex: number;

                if (axis.directionClockwise) {
                    startIndex = 0;
                    endIndex = tickCount - 1;
                } else {
                    startIndex = tickCount - 1;
                    endIndex = 0;
                }
                if (this.isBetween(targetValue, axis.startValue, axisLabels[startIndex].value) || (!this.isBetween(targetValue, axis.startValue, axis.endValue)
                    && ((axis.directionClockwise && targetValue <= axis.startValue) || (!axis.directionClockwise && targetValue >= axis.startValue)))) {
                    if (targetValue !== axisLabels[startIndex].value) {
                        // avoid repeating
                        // target Value is between startValue and the first Axis Label
                        targetRect = this.placeTargetBeforeFirstLabel(axisLabels[startIndex].rect, targetRect, targetDetails);
                    }
                }
                else if (this.isBetween(targetValue, axisLabels[endIndex].value, axis.endValue) || (!this.isBetween(targetValue, axis.startValue, axis.endValue)
                    && ((axis.directionClockwise && targetValue >= axis.endValue) || (!axis.directionClockwise && targetValue <= axis.endValue)))) {
                    if (targetValue !== axisLabels[endIndex].value) { // avoid repeating
                        // target Value is between last Axis Label and endValue
                        targetRect = this.placeTargetAfterLastLabel(axisLabels[endIndex].rect, targetRect, targetDetails);
                    }
                }
            }
        }

        return this.isWithinBounds(targetRect) && !this.isOverlappingWithCallout(targetRect) ? targetRect : null;
    }

    /*
    * Return which quadrant the angle is in
    * Angle can be between negative infinity to positive infinity
    */
    private static getQuadrant(angle: number): number {
        let quadrant: number;

        if (Math.sin(angle) >= 0) {
            if (Math.cos(angle) >= 0) {
                quadrant = 1;
            } else {
                quadrant = 2;
            }
        } else {
            if (Math.cos(angle) >= 0) {
                quadrant = 4;
            } else {
                quadrant = 3;
            }
        }

        return quadrant;
    }

    // Translate the angle to the scale -PI to + PI
    private static normalizeAngle(angle: number): number {
        let normalizedAngle: number = angle % Tachometer.TwoPI;

        if (normalizedAngle > Math.PI) {
            normalizedAngle = normalizedAngle - Tachometer.TwoPI;
        } else if (normalizedAngle < - Math.PI) {
            normalizedAngle = normalizedAngle + Tachometer.TwoPI;
        }

        return normalizedAngle;
    }

    private static isNotNegative(value: number): Boolean {
        return value === undefined || value >= 0;
    }

    private isBetween(value: number, startValue: number, endValue: number): Boolean {
        // second check is for reversed values
        return (value > startValue && value <= endValue) || (value < startValue && value >= endValue);
    }

    private placeTargetBetweenLabels(firstRect: TachometerRectangle, secondRect: TachometerRectangle, targetRect: TachometerRectangle, targetDetails: TargetDetails): TachometerRectangle {
        let moveTargetClockwise = this.axisData.directionClockwise;
        let overlappingRect = null;
        let nextRect = null;

        if (this.isOverlapping(targetRect, firstRect)) {
            overlappingRect = firstRect;
            nextRect = secondRect;
        } else if (this.isOverlapping(targetRect, secondRect)) {
            overlappingRect = secondRect;
            nextRect = firstRect;
            moveTargetClockwise = !moveTargetClockwise;
        } else {
            return targetRect;
        }

        return this.moveTargetAwayFromLabel(overlappingRect, nextRect, targetRect, targetDetails, moveTargetClockwise);
    }

    private placeTargetBeforeFirstLabel(labelRectangle: TachometerRectangle, targetRect: TachometerRectangle, targetDetails: TargetDetails): TachometerRectangle {
        // There may be room between the first label and start of the dial
        // Create a rectangle of 1 pixel width at the start of the dial and use it along with the last label to place the target
        let axisData = this.axisData;
        let startRectOnAxis: TachometerRectangle = this.getUnitRectangle(axisData.startAngle);
        let endRectOnAxis: TachometerRectangle = this.getUnitRectangle(axisData.endAngle);

        let targetRectangle;

        if (axisData.directionClockwise) {
            targetRectangle = this.placeTargetBetweenLabels(startRectOnAxis, labelRectangle, targetRect, targetDetails);
        } else {
            targetRectangle = this.placeTargetBetweenLabels(labelRectangle, startRectOnAxis, targetRect, targetDetails);
        }

        if (targetRectangle != null) {
            return this.moveTargetCloserToGaugeStart(targetRectangle, startRectOnAxis, endRectOnAxis);
        }

        return null;
    }

    private placeTargetAfterLastLabel(labelRectangle: TachometerRectangle, targetRect: TachometerRectangle, targetDetails: TargetDetails): TachometerRectangle {
        // There may be room between the last label and end of the dial
        // Create a rectangle of 1 pixel width at the end of the dial and use it along with the last label to place the target
        let axisData = this.axisData;
        let startRectOnAxis: TachometerRectangle = this.getUnitRectangle(axisData.startAngle);
        let endRectOnAxis: TachometerRectangle = this.getUnitRectangle(axisData.endAngle);

        let targetRectangle;

        if (axisData.directionClockwise) {
            targetRectangle = this.placeTargetBetweenLabels(labelRectangle, endRectOnAxis, targetRect, targetDetails);
        }
        else {
            targetRectangle = this.placeTargetBetweenLabels(endRectOnAxis, labelRectangle, targetRect, targetDetails);
        }

        if (targetRectangle != null) {
            return this.moveTargetCloserToGaugeEnd(targetRectangle, startRectOnAxis, endRectOnAxis);
        }

        return null;
    }

    private moveTargetAwayFromLabel(overlappingLabel: TachometerRectangle, nextLabel: TachometerRectangle, targetRect: TachometerRectangle, targetDetails: TargetDetails, moveTargetClockwise: boolean): TachometerRectangle {
        let newTargetRect: TachometerRectangle = null;
        let absSinTargetAngle = Math.abs(Math.sin(targetDetails.targetAngle));

        if (absSinTargetAngle < Tachometer.PreferHorizontalThreshold) {
            // closer to the vertical top or bottom of the circle
            newTargetRect = this.getHorizontalRoomBetweenLabels(overlappingLabel, nextLabel, targetRect, targetDetails);

            if (newTargetRect == null) {
                newTargetRect = this.getVerticalRoomBetweenLabels(overlappingLabel, nextLabel, targetRect, targetDetails, moveTargetClockwise);
            }
        } else {
            // 1. check whether we have room between the two labels to accomodate the target
            newTargetRect = this.getVerticalRoomBetweenLabels(overlappingLabel, nextLabel, targetRect, targetDetails, moveTargetClockwise);

            if (newTargetRect == null) {
                newTargetRect = this.getHorizontalRoomBetweenLabels(overlappingLabel, nextLabel, targetRect, targetDetails);
            }
        }

        if (newTargetRect == null) {
            newTargetRect = this.getPlacementBetweenLabels(overlappingLabel, nextLabel, targetRect, targetDetails);
        }

        return newTargetRect;
    }

    // get a rectangle 1px wide and 1px tall along gauge axis at the given angle
    private getUnitRectangle(angle: number): TachometerRectangle {
        let axisData = this.axisData;
        let axisStartX = axisData.offset.x + axisData.radius * Math.sin(angle);
        let axisStartY = axisData.offset.y - axisData.radius * Math.cos(angle);

        return {
            left: axisStartX,
            top: axisStartY,
            right: axisStartX + 1,
            bottom: axisStartY + 1
        };
    }

    // Attempt to move the target rectangle close to gauge dial when placed too far by the methods translateYFromGaugeAxis and translateXFromGaugeAxis
    private moveTargetCloserToGaugeStart(target: TachometerRectangle, startPoint: TachometerRectangle, endPoint: TachometerRectangle): TachometerRectangle {
        let altTarget: TachometerRectangle;

        switch (this.axisData.startQuadrant) {
            case 1:
                return target;
            case 2:
                if (target.left > startPoint.right) {
                    altTarget = this.copyRectangle(target);

                    let requiredWidth = altTarget.right - altTarget.left;

                    altTarget.left = startPoint.right + this.gaugeStyle.target.padding;
                    altTarget.right = altTarget.left + requiredWidth;
                }
                break;
            case 3:
                return target;
            case 4:
                if (target.right < startPoint.left) {
                    altTarget = this.copyRectangle(target);

                    let requiredWidth = altTarget.right - altTarget.left;

                    altTarget.right = startPoint.left - this.gaugeStyle.target.padding;
                    altTarget.left = altTarget.right - requiredWidth;
                }
                break;
        }

        if (altTarget != null) {
            if (this.isOverlapping(altTarget, endPoint)) {
                return target; // can't move Target
            } else {
                // gaurantee that we do not overlap new target with any axis label
                let tickCount = this.axisLabels.length;

                for (let i = 0; i < tickCount; i++) {
                    if (this.isOverlapping(altTarget, this.axisLabels[i].rect)) {
                        return target;
                    }
                }

                // reaching here means that we can move the target closer to the axis
                return altTarget;
            }
        }

        return target;
    }

    // Attempt to move the target rectangle close to gauge dial when placed too far by the methods translateYFromGaugeAxis and translateXFromGaugeAxis
    private moveTargetCloserToGaugeEnd(target: TachometerRectangle, startPoint: TachometerRectangle, endPoint: TachometerRectangle): TachometerRectangle {
        let altTarget: TachometerRectangle;

        switch (this.axisData.endQuadrant) {
            case 1:
                if (target.left > endPoint.right) {
                    altTarget = this.copyRectangle(target);

                    let requiredWidth = altTarget.right - altTarget.left;

                    altTarget.left = endPoint.right + this.gaugeStyle.target.padding;
                    altTarget.right = altTarget.left + requiredWidth;
                }

                break;
            case 2:
                return target;
            case 3:
                if (target.right < endPoint.left) {
                    altTarget = this.copyRectangle(target);

                    let requiredWidth = altTarget.right - altTarget.left;

                    altTarget.right = endPoint.left - this.gaugeStyle.target.padding;
                    altTarget.left = altTarget.right - requiredWidth;
                }

                break;
            case 4:
                return target;
        }

        if (altTarget != null) {
            if (this.isOverlapping(altTarget, startPoint)) {
                // can't move Target
                return target;
            } else {
                // gaurantee that we do not overlap new target with any axis label
                let tickCount = this.axisLabels.length;

                for (let i = 0; i < tickCount; i++) {
                    if (this.isOverlapping(altTarget, this.axisLabels[i].rect)) {
                        return target;
                    }
                }

                // reaching here means that we can move the target closer to the axis
                return altTarget;
            }
        }

        return target;
    }

    // if there is room return valid rectangle, otherwise return null
    private getHorizontalRoomBetweenLabels(rectangle1: TachometerRectangle, rectangle2: TachometerRectangle, targetRectangle: TachometerRectangle, targetDetails: TargetDetails): TachometerRectangle {
        let requiredRoom = targetRectangle.right - targetRectangle.left;
        let roomBetweenLabels = 0;

        let rectangle1OnTopHalf = rectangle1.bottom < targetDetails.centerY;
        let rectangle1OnLeftHalf = rectangle1.left < targetDetails.centerX;
        let rectangle2OnTopHalf = rectangle2.bottom < targetDetails.centerY;
        let rectangle2OnLeftHalf = rectangle2.left < targetDetails.centerX;

        if ((rectangle1OnTopHalf !== rectangle2OnTopHalf) || (rectangle1OnLeftHalf === rectangle2OnLeftHalf)) {
            // to move horizontally, the two rectangles should be on the top or bottom and across the vertical axis
            return null;
        }

        let baseX: number = 0;

        if (rectangle1.left < rectangle2.left) {
            roomBetweenLabels = rectangle2.left - rectangle1.right;
            baseX = rectangle1.right;
        } else {
            roomBetweenLabels = rectangle1.left - rectangle2.right;
            baseX = rectangle2.right;
        }

        if (roomBetweenLabels > requiredRoom) {
            // has room between the two labels to fit the target
            baseX = baseX + ((roomBetweenLabels - requiredRoom) / 2); // center between labels
            targetRectangle.left = baseX;
            targetRectangle.right = baseX + requiredRoom;

            // move X to gaurantee that target text does not overlap the gauge dial
            targetRectangle = this.translateYFromGaugeAxis(targetRectangle, targetDetails);

            if (this.isOverlapping(targetRectangle, rectangle1) || this.isOverlapping(targetRectangle, rectangle2) || this.isOverlappingWithCallout(targetRectangle)) {
                return null;
            }

            return targetRectangle;
        }

        return null;
    }

    // if there is room return valid rectangle, otherwise return null
    // move the target towards the next rectangle along the gauge axis clockwise or counter clockwise as indicated
    private getVerticalRoomBetweenLabels(overlappingRectangle: TachometerRectangle, nextRectangle: TachometerRectangle, targetRectangle: TachometerRectangle, targetDetails: TargetDetails, targetMoveDirection: boolean): TachometerRectangle {
        let requiredRoom = targetRectangle.bottom - targetRectangle.top;
        let targetTop = 0;

        if ((targetDetails.onRightSide && targetMoveDirection)
            || (!targetDetails.onRightSide && !targetMoveDirection)
        ) {
            // means that we have to move target down
            targetTop = overlappingRectangle.bottom + this.gaugeStyle.target.padding;
        } else {
            // means that we have to move the target up
            targetTop = overlappingRectangle.top - requiredRoom - this.gaugeStyle.target.padding;
        }

        let newTargetRectangle: TachometerRectangle = {
            left: targetRectangle.left,
            top: targetTop,
            right: targetRectangle.right,
            bottom: targetTop + requiredRoom
        };

        // move X to gaurantee that target text does not overlap the gauge dial
        newTargetRectangle = this.translateXFromGaugeAxis(newTargetRectangle, targetDetails);

        if (newTargetRectangle != null && !this.isOverlapping(newTargetRectangle, nextRectangle) && !this.isOverlappingWithCallout(newTargetRectangle)) {
            return newTargetRectangle;
        }

        return null;
    }

    private getPlacementBetweenLabels(overlappingRect: TachometerRectangle, nextRect: TachometerRectangle, targetRectangle: TachometerRectangle, targetDetails: TargetDetails): TachometerRectangle {
        let onRightSide: boolean = targetRectangle.left >= targetDetails.centerX;
        let onBottom: boolean = targetRectangle.bottom >= targetDetails.centerY;
        let requiredHeight = targetRectangle.bottom - targetRectangle.top;
        let requiredWidth = targetRectangle.right - targetRectangle.left;
        let targetBottom = 0;
        let targetLeft = 0;

        if (onBottom) {
            targetBottom = Math.min(overlappingRect.bottom, nextRect.bottom) + requiredHeight + this.gaugeStyle.target.padding;
        } else {
            targetBottom = Math.max(overlappingRect.top, nextRect.top) - this.gaugeStyle.target.padding;
        }

        if (onRightSide) {
            targetLeft = Math.min(overlappingRect.right, nextRect.right) + this.gaugeStyle.target.padding;
        } else {
            targetLeft = Math.max(overlappingRect.left, nextRect.left) - this.gaugeStyle.target.padding - requiredWidth;
        }

        targetRectangle.left = targetLeft;
        targetRectangle.right = targetLeft + requiredWidth;
        targetRectangle.top = targetBottom - requiredHeight;
        targetRectangle.bottom = targetBottom;
        targetRectangle = this.translateXFromGaugeAxis(targetRectangle, targetDetails);
        targetRectangle = this.translateYFromGaugeAxis(targetRectangle, targetDetails);

        if (this.isOverlapping(targetRectangle, overlappingRect) || this.isOverlapping(targetRectangle, nextRect) || this.isOverlappingWithCallout(targetRectangle)) {
            // Note, this part is switched
            if (onRightSide) {
                targetLeft = Math.max(overlappingRect.left, nextRect.left) - this.gaugeStyle.target.padding - requiredWidth;
            } else {
                targetLeft = Math.min(overlappingRect.right, nextRect.right) + this.gaugeStyle.target.padding;
            }

            targetRectangle.left = targetLeft;
            targetRectangle.right = targetLeft + requiredWidth;

            // When we switch above logic, there is potential of overlapping with gauge
            targetRectangle = this.translateXFromGaugeAxis(targetRectangle, targetDetails);
            targetRectangle = this.translateYFromGaugeAxis(targetRectangle, targetDetails);

            if (this.isOverlapping(targetRectangle, overlappingRect) || this.isOverlapping(targetRectangle, nextRect) || this.isOverlappingWithCallout(targetRectangle)) {
                // now try to go far left or far right as possible
                if (onRightSide) {
                    targetLeft = Math.max(overlappingRect.right, nextRect.right) + this.gaugeStyle.target.padding;
                } else {
                    targetLeft = Math.min(overlappingRect.left, nextRect.left) - this.gaugeStyle.target.padding - requiredWidth;
                }

                targetRectangle.left = targetLeft;
                targetRectangle.right = targetLeft + requiredWidth;

                // When we switch above logic, there is potential of overlapping with gauge
                targetRectangle = this.translateXFromGaugeAxis(targetRectangle, targetDetails);
                targetRectangle = this.translateYFromGaugeAxis(targetRectangle, targetDetails);

                if (this.isOverlapping(targetRectangle, overlappingRect) || this.isOverlapping(targetRectangle, nextRect) || this.isOverlappingWithCallout(targetRectangle)) {
                    return null;
                }
            }
        }

        return targetRectangle;
    }

    private copyRectangle(rectangle: TachometerRectangle): TachometerRectangle {
        return {
            top: rectangle.top,
            bottom: rectangle.bottom,
            left: rectangle.left,
            right: rectangle.right
        };
    }

    // move along Y axis to avoid overlap
    private translateYFromGaugeAxis(rectangle: TachometerRectangle, targetDetails: TargetDetails): TachometerRectangle {
        if (rectangle == null) {
            return null;
        }

        let targetLeftOnGaugeRight: boolean = rectangle.left >= targetDetails.centerX;
        let targetRightOnGaugeRight: boolean = rectangle.right >= targetDetails.centerX;
        let targetTopOnGaugeTop: boolean = rectangle.top <= targetDetails.centerY;
        let requiredHeight = rectangle.bottom - rectangle.top;

        if (targetLeftOnGaugeRight === targetRightOnGaugeRight) {
            // both on right or left
            // minimun distance required from gauge center along Y axis to avoid overlap
            let gaugePivotX = targetRightOnGaugeRight ? Math.abs(rectangle.left - targetDetails.centerX) : Math.abs(targetDetails.centerX - rectangle.right);
            let gaugePivotYLimit = targetDetails.labelRadius * Math.cos(Math.asin(gaugePivotX / targetDetails.labelRadius));

            if (!isNaN(gaugePivotYLimit)) {
                // means that x is already ourside of the circle so no need to change Y
                if (targetTopOnGaugeTop) {
                    gaugePivotYLimit = targetDetails.centerY - gaugePivotYLimit;

                    if (gaugePivotYLimit < rectangle.bottom) {
                        // potential overlap with gauge
                        rectangle.top = gaugePivotYLimit - requiredHeight;
                        rectangle.bottom = gaugePivotYLimit;
                    }
                }
                else {
                    gaugePivotYLimit = targetDetails.centerY + gaugePivotYLimit;

                    if (gaugePivotYLimit > rectangle.top) {
                        // potential overlap with gauge
                        rectangle.top = gaugePivotYLimit;
                        rectangle.bottom = gaugePivotYLimit + requiredHeight;
                    }
                }
            }
        } else {
            // target spanning left to right of the center
            if (targetTopOnGaugeTop) {
                // upper hemisphere
                let gaugePivotYLimit: number = targetDetails.centerY - targetDetails.labelRadius;

                if (rectangle.bottom > gaugePivotYLimit) {
                    rectangle.top = gaugePivotYLimit - requiredHeight;
                    rectangle.bottom = gaugePivotYLimit;
                }
            }
            else {
                let gaugePivotYLimit: number = targetDetails.centerY + targetDetails.labelRadius;

                if (rectangle.top < gaugePivotYLimit) {
                    rectangle.top = gaugePivotYLimit;
                    rectangle.bottom = gaugePivotYLimit + requiredHeight;
                }
            }
        }

        return this.isWithinBounds(rectangle) ? rectangle : null;
    }

    // move along X axis to avoid overlap
    private translateXFromGaugeAxis(rectangle: TachometerRectangle, targetDetails: TargetDetails): TachometerRectangle {
        if (rectangle == null) {
            // going out of range
            return null;
        }

        let targetLeftOnGaugeRight: boolean = rectangle.left >= targetDetails.centerX;
        let targetRightOnGaugeRight: boolean = rectangle.right >= targetDetails.centerX;
        let targetTopOnGaugeTop: boolean = rectangle.top <= targetDetails.centerY;
        let targetBottomOnGageBottom: boolean = rectangle.bottom <= targetDetails.centerY;
        let requiredWidth = rectangle.right - rectangle.left;

        let gaugePivotY = 0;
        let gaugePivotXLimit;

        if (targetTopOnGaugeTop === targetBottomOnGageBottom) {
            // both on tophalf or bottom half
            gaugePivotY = targetTopOnGaugeTop ? targetDetails.centerY - rectangle.bottom : rectangle.top - targetDetails.centerY;

            gaugePivotXLimit = targetDetails.labelRadius * Math.sin(Math.acos(gaugePivotY / targetDetails.labelRadius));

            if (!isNaN(gaugePivotXLimit)) {
                // this means that y is already outside the circle
                if (targetLeftOnGaugeRight && targetRightOnGaugeRight) {
                    // bot on right
                    gaugePivotXLimit = targetDetails.centerX + gaugePivotXLimit;

                    if (gaugePivotXLimit > rectangle.left) {
                        // potential overlap with gauge
                        rectangle.left = gaugePivotXLimit;
                        rectangle.right = gaugePivotXLimit + requiredWidth;
                    }
                }
                else if (!targetLeftOnGaugeRight && !targetRightOnGaugeRight) {
                    // both on left
                    gaugePivotXLimit = targetDetails.centerX - gaugePivotXLimit;

                    if (gaugePivotXLimit < rectangle.right) {
                        // potential overlap with gauge
                        rectangle.right = gaugePivotXLimit;
                        rectangle.left = gaugePivotXLimit - requiredWidth;
                    }
                }
            }
        } else {
            if (targetLeftOnGaugeRight) {
                gaugePivotXLimit = targetDetails.centerX + targetDetails.labelRadius;

                if (rectangle.left < gaugePivotXLimit) {
                    rectangle.left = gaugePivotXLimit;
                    rectangle.right = gaugePivotXLimit + requiredWidth;
                }
            }
            else {
                gaugePivotXLimit = targetDetails.centerX - targetDetails.labelRadius;

                if (rectangle.right > gaugePivotXLimit) {
                    rectangle.right = gaugePivotXLimit;
                    rectangle.left = gaugePivotXLimit - requiredWidth;
                }
            }
        }

        return this.isWithinBounds(rectangle) ? rectangle : null;
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        let enumeration: VisualObjectInstance[] = [];

        switch (options.objectName) {
            case 'axis':
                this.enumerateAxis(enumeration);

                break;
            case 'rangeDefaults':
                this.enumerateRangeDefaults(enumeration);

                break;
            case 'range1':
                this.enumerateRange(enumeration, this.viewModel && this.viewModel.settings && this.viewModel.settings.range1, 'range1', 'Range 1', false);

                break;
            case 'range2':
                this.enumerateRange(enumeration, this.viewModel && this.viewModel.settings && this.viewModel.settings.range2, 'range2', 'Range 2', true, Tachometer.RoleNames.range2StartValue);

                break;
            case 'range3':
                this.enumerateRange(enumeration, this.viewModel && this.viewModel.settings && this.viewModel.settings.range3, 'range3', 'Range 3', true, Tachometer.RoleNames.range3StartValue);

                break;
            case 'range4':
                this.enumerateRange(enumeration, this.viewModel && this.viewModel.settings && this.viewModel.settings.range4, 'range4', 'Range 4', true, Tachometer.RoleNames.range4StartValue);

                break;
            case 'range5':
                this.enumerateRange(enumeration, this.viewModel && this.viewModel.settings && this.viewModel.settings.range5, 'range5', 'Range 5', true, Tachometer.RoleNames.range5StartValue);

                break;
            case 'range6':
                this.enumerateRange(enumeration, this.viewModel && this.viewModel.settings && this.viewModel.settings.range6, 'range6', 'Range 6', true, Tachometer.RoleNames.range6StartValue);

                break;
            case 'range7':
                this.enumerateRange(enumeration, this.viewModel && this.viewModel.settings && this.viewModel.settings.range7, 'range7', 'Range 7', true, Tachometer.RoleNames.range7StartValue);

                break;
            case 'target':
                this.enumerateTarget(enumeration);

                break;
            case 'indicator':
                this.enumerateIndicator(enumeration);

                break;
            case 'labels':
                this.enumerateDataLabels(enumeration, 'labels');

                break;
            case 'calloutValue':
                let calloutValueSettings = this.viewModel && this.viewModel.callout.calloutValue
                    ? this.viewModel.callout.calloutValue
                    : Tachometer.getDefaultTachometerCalloutSettings();

                this.enumerateCalloutProperties(enumeration, 'calloutValue', 'Callout Value', calloutValueSettings);

                break;
            case 'calloutPercent':
                let calloutPercentSettings = this.viewModel && this.viewModel.callout.calloutPercent
                    ? this.viewModel.callout.calloutPercent
                    : Tachometer.getDefaultTachometerCalloutPercentSettings();

                this.enumerateCalloutPercentProperties(enumeration, 'calloutPercent', 'Callout Percent', calloutPercentSettings);

                break;
            case 'margins':
                this.enumerateMarginProperties(enumeration);

                break;
        }

        return enumeration;
    }

    private enumerateAxis(enumeration: VisualObjectInstance[]): void {
        let axisVisualSettings: AxisVisualSettings = this.viewModel && this.viewModel.settings && this.viewModel.settings.axis;
        let hasVisualSettings: boolean = axisVisualSettings != null;

        let properties: any = {};

        properties.startAngle = hasVisualSettings && axisVisualSettings.startAngle != null ? axisVisualSettings.startAngle : null;
        properties.endAngle = hasVisualSettings && axisVisualSettings.endAngle != null ? axisVisualSettings.endAngle : null;

        let startValue: number;
        let endValue: number;

        if (!DataRoleHelper.hasRoleInDataView(this.dataView, Tachometer.RoleNames.startValue)) {
            startValue = properties.startValue = hasVisualSettings && axisVisualSettings.startValue != null ? axisVisualSettings.startValue : null;
        } else {
            startValue = this.axisData.startValue;
        }

        if (!DataRoleHelper.hasRoleInDataView(this.dataView, Tachometer.RoleNames.endValue)) {
            endValue = properties.endValue = hasVisualSettings && axisVisualSettings.endValue != null ? axisVisualSettings.endValue : null;
        } else {
            endValue = this.axisData.endValue;
        }

        properties.axisScaleType = hasVisualSettings && axisVisualSettings.axisScaleType
            && Tachometer.isNotNegative(startValue) && Tachometer.isNotNegative(endValue) // log scale not defined for negative values
            ? axisVisualSettings.axisScaleType : AxisScaleType.linear;

        enumeration.push({
            objectName: 'axis',
            displayName: 'Axis',
            properties: <any>properties,
            selector: null,
        });
    }

    private enumerateRangeDefaults(enumeration: VisualObjectInstance[]): void {
        let rangeDefaultVisualSettings: RangeDefaultSettings = this.viewModel && this.viewModel.settings && this.viewModel.settings.rangeDefaults;
        let hasVisualSettings: boolean = rangeDefaultVisualSettings != null;

        let properties: any = {};

        properties.colorScheme = hasVisualSettings && rangeDefaultVisualSettings.colorScheme != null ? rangeDefaultVisualSettings.colorScheme : ColorScheme.redGreenRed;

        enumeration.push({
            objectName: 'rangeDefaults',
            displayName: 'Range Defaults',
            properties: <any>properties,
            selector: null,
        });
    }

    private enumerateRange(enumeration: VisualObjectInstance[], rangeVisualSettings: RangeVisualSettings, rangeName: string, rangeDisplayName: string, showStartValue: boolean, startValueDataRoleName?: string): void {
        let hasVisualSettings: boolean = rangeVisualSettings !== undefined && rangeVisualSettings !== null;

        let properties: any = {};

        properties.rangeColor = hasVisualSettings && rangeVisualSettings.rangeColor ? rangeVisualSettings.rangeColor : null;
        properties.thickness = hasVisualSettings && rangeVisualSettings.thickness !== null ? rangeVisualSettings.thickness : null;

        if (showStartValue && startValueDataRoleName && !DataRoleHelper.hasRoleInDataView(this.dataView, startValueDataRoleName)) {
            properties.startValue = hasVisualSettings && rangeVisualSettings.startValue !== null ? rangeVisualSettings.startValue : null;
        }

        enumeration.push({
            objectName: rangeName,
            displayName: rangeDisplayName,
            properties: <any>properties,
            selector: null,
        });
    }

    private enumerateTarget(enumeration: VisualObjectInstance[]): void {
        let targetVisualSettings: TargetVisualSettings = this.viewModel && this.viewModel.settings && this.viewModel.settings.target;
        let hasVisualSettings: boolean = targetVisualSettings != null;

        let properties: any = {};

        properties['show'] = hasVisualSettings && targetVisualSettings.show != null ? targetVisualSettings.show : true;

        if (!DataRoleHelper.hasRoleInDataView(this.dataView, Tachometer.RoleNames.targetValue)) {
            properties.value = hasVisualSettings ? targetVisualSettings.value : null;
        }

        properties.lineColor = hasVisualSettings && targetVisualSettings.lineColor ? targetVisualSettings.lineColor : null;
        properties.innerRadiusRatio = hasVisualSettings && targetVisualSettings.innerRadiusRatio ? Tachometer.clamp(targetVisualSettings.innerRadiusRatio, 0, Tachometer.MaxTargetRadiusFactor) : null;
        properties.textColor = hasVisualSettings && targetVisualSettings.textColor ? targetVisualSettings.textColor : Tachometer.DefaultLabelColor;
        properties.fontSize = hasVisualSettings && targetVisualSettings.fontSize ? targetVisualSettings.fontSize : minLabelFontSize;

        enumeration.push({
            objectName: 'target',
            displayName: 'Target',
            properties: <any>properties,
            selector: null,
        });
    }

    private enumerateIndicator(enumeration: VisualObjectInstance[]): void {
        let indicatorVisualSettings: IndicatorVisualSettings = this.viewModel && this.viewModel.settings && this.viewModel.settings.indicator;
        let hasVisualSettings: boolean = indicatorVisualSettings != null;

        let properties: any = {};

        properties.pointerColor = hasVisualSettings && indicatorVisualSettings.pointerColor != null ? indicatorVisualSettings.pointerColor : null;
        properties.pointerSizeFactor = hasVisualSettings && indicatorVisualSettings.pointerSizeFactor != null ? indicatorVisualSettings.pointerSizeFactor : null;
        properties.baseColor = hasVisualSettings && indicatorVisualSettings.baseColor != null ? indicatorVisualSettings.baseColor : null;
        properties.baseThicknessFactor = hasVisualSettings && indicatorVisualSettings.baseThicknessFactor != null ? indicatorVisualSettings.baseThicknessFactor : null;

        enumeration.push({
            selector: null,
            objectName: 'indicator',
            displayName: 'Indicator',
            properties: <any>properties,
        });
    }

    private enumerateDataLabels(enumeration: VisualObjectInstance[], objectName: string): void {
        let labelsVisualSettings: LabelsVisualSettings = this.viewModel && this.viewModel.settings && this.viewModel.settings.labels;
        let hasVisualSettings: boolean = labelsVisualSettings != null;

        let instance: VisualObjectInstance = {
            objectName: objectName,
            selector: null,
            properties: {},
        };

        let labelSettings = this.viewModel && this.axisData.dataLabels ? this.axisData.dataLabels : Tachometer.getDefaultTachometerLabelSettings();

        this.enumerateLabelInstance(instance, labelSettings);

        // Show nicely rounded labels such as 100, 200 etc.
        instance.properties['round'] = labelSettings.round;

        // Allow user to specify the number of ticks only if the axis settings:
        //     - are not initialized
        //     - scale is linear
        //     - user has not requested to round the scale
        if ((this.axisData == null) || ((this.axisData != null) && (this.axisData.axisScaleType === AxisScaleType.linear)) || (!labelSettings.round)) {
            if (hasVisualSettings) {
                instance.properties['count'] = labelsVisualSettings.count;
            }
            else {
                instance.properties['count'] = null;
            }
        }
        else if ((this.axisData != null) && (this.axisData.axisScaleType === AxisScaleType.log) && (labelSettings.round)) {
            // If the scale is log, and user speficied 'round', there is a possibility of displaying a
            // very large number of labels. So give the option to reduce the number of labels.
            instance.properties['reduce'] = labelSettings.reduce;
        }

        enumeration.push(instance);
    }

    private enumerateCalloutProperties(enumeration: VisualObjectInstance[], objectName: string, displayName: string, labelSettings: TachometerDataLabelsData): void {
        let calloutValueVisualSettings: CalloutValueVisualSettings = this.viewModel && this.viewModel.settings && this.viewModel.settings.calloutValue;
        let hasVisualSettings: boolean = calloutValueVisualSettings != null;

        let instance: VisualObjectInstance = {
            objectName: objectName,
            displayName: displayName,
            properties: {},
            selector: null,
        };

        instance.properties['show'] = hasVisualSettings ? calloutValueVisualSettings.show : labelSettings.show;
        instance.properties['color'] = hasVisualSettings ? calloutValueVisualSettings.color : labelSettings.labelColor || Tachometer.DefaultLabelColor;

        if (labelSettings.displayUnits !== null) {
            instance.properties['labelDisplayUnits'] = hasVisualSettings ? calloutValueVisualSettings.labelDisplayUnits : labelSettings.displayUnits;
        }

        instance.properties['labelPrecision'] = hasVisualSettings ? calloutValueVisualSettings.labelPrecision : labelSettings.precision === dataLabelUtils.defaultLabelPrecision ? null : labelSettings.precision;
        instance.properties['fontSize'] = hasVisualSettings ? calloutValueVisualSettings.fontSize : labelSettings.fontSize;

        instance.properties['xOffset'] = (hasVisualSettings && calloutValueVisualSettings.xOffset !== null) && (labelSettings.offset && labelSettings.offset.x) ?
                labelSettings.offset.x :
                null;

        instance.properties['yOffset'] = (hasVisualSettings && calloutValueVisualSettings.yOffset !== null) && (labelSettings.offset && labelSettings.offset.y && labelSettings.offset.y !== null) ?
                -labelSettings.offset.y : // switching direction for intutive user experience of +ve up
                null;

        enumeration.push(instance);
    }

    private enumerateCalloutPercentProperties(enumeration: VisualObjectInstance[], objectName: string, displayName: string, labelSettings: TachometerDataLabelsData): void {
        let calloutPercentVisualSettings: CalloutPercentVisualSettings = this.viewModel && this.viewModel.settings && this.viewModel.settings.calloutPercent;
        let hasVisualSettings: boolean = calloutPercentVisualSettings != null;

        let instance: VisualObjectInstance = {
            objectName: objectName,
            displayName: displayName,
            properties: {},
            selector: null,
        };

        instance.properties['show'] = hasVisualSettings ? calloutPercentVisualSettings.show : labelSettings.show;
        instance.properties['color'] = hasVisualSettings ? calloutPercentVisualSettings.color : labelSettings.labelColor || Tachometer.DefaultLabelColor;
        instance.properties['labelPrecision'] = hasVisualSettings ? calloutPercentVisualSettings.labelPrecision : labelSettings.precision === dataLabelUtils.defaultLabelPrecision ? null : labelSettings.precision;
        instance.properties['fontSize'] = hasVisualSettings ? calloutPercentVisualSettings.fontSize : labelSettings.fontSize;

        instance.properties['xOffset'] = (hasVisualSettings && calloutPercentVisualSettings.xOffset !== null) && (labelSettings.offset && labelSettings.offset.x) ?
                labelSettings.offset.x : 
                null;

        instance.properties['yOffset'] = (hasVisualSettings && calloutPercentVisualSettings.yOffset !== null) && (labelSettings.offset && labelSettings.offset.y && labelSettings.offset.y !== null) ?
                -labelSettings.offset.y : // switching direction for intutive user experience of +ve up
                null;

        instance.properties['percentType'] = hasVisualSettings && calloutPercentVisualSettings.percentType !== null ? calloutPercentVisualSettings.percentType : labelSettings.percentType;
        instance.properties['invert'] = hasVisualSettings && calloutPercentVisualSettings.invert !== null ? calloutPercentVisualSettings.invert : labelSettings.invert;

        enumeration.push(instance);
    }

    private enumerateLabelInstance(instance: VisualObjectInstance, labelSettings: TachometerDataLabelsData) {
        let precision = labelSettings.precision;

        instance.properties['show'] = labelSettings.show;
        instance.properties['color'] = labelSettings.labelColor || Tachometer.DefaultLabelColor;

        if (labelSettings.displayUnits != null) {
            instance.properties['labelDisplayUnits'] = labelSettings.displayUnits;
        }

        instance.properties['labelPrecision'] = precision === dataLabelUtils.defaultLabelPrecision ? null : precision;
        instance.properties['fontSize'] = labelSettings.fontSize;
    }
}
