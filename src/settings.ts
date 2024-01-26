/*
 *  Power BI Visualizations
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

// powerbi
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

// powerbi.extensibility.utils.dataview
import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

import { Tachometer } from "./visual";

export enum AxisScaleType {
    linear = <any>"Linear",
    log = <any>"Log"
}

export enum ColorScheme {
    greenRedGreen = <any>"Green/Red/Green",
    redGreenRed = <any>"Red/Green/Red"
}

// Where percent value is measured against
export enum PercentType {
    endValue = <any>"EndValue",
    target =<any>"Target",
    range2Start = <any>"Range2Start",
    range3Start = <any>"Range3Start",
    range4Start = <any>"Range4Start",
    range5Start = <any>"Range5Start",
    range6Start = <any>"Range6Start",
    range7Start = <any>"Range7Start",
    range8Start = <any>"Range8Start",
    range9Start = <any>"Range9Start"
}

export class AxisVisualSettings {
    public startAngle?: number = null;
    public endAngle?: number = null;
    public startValue?: number = null;
    public endValue?: number = null;

    // Scale to measure data in the gauge
    public axisScaleType?: AxisScaleType = AxisScaleType.linear;
}

export class RangeDefaultSettings {
    public colorScheme: ColorScheme = ColorScheme.redGreenRed;
}

export class RangeVisualSettings {
    public rangeColor: string = null;
    public thickness?: number = null;
    public startValue?: number = null;
}

export class TargetVisualSettings {
    public show: boolean = true;
    public value?: number = null;
    public lineColor: string = "#000000";
    public innerRadiusRatio?: number = null;
    public textColor: string = Tachometer.DefaultLabelColor;
    public fontSize?: number = 8;
}

export class IndicatorVisualSettings {
    public pointerColor: string = null;
    public pointerSizeFactor?: number = null;

    // Ratio of distance to Pointer tip as a factor of radius
    public baseColor: string = null;
    // Inner Radius of the base as a ratio of its outer radius
    public baseThicknessFactor?: number = null;
}

export class LabelsVisualSettings {
    public show: boolean = true;
    public color: string = Tachometer.DefaultLabelColor;
    public fontSize?: number = 9;
    public labelDisplayUnits?: number = 0;
    public labelPrecision?: number = null;
    public round?: boolean = true;
    public count?: number = null;
    public reduce?: boolean = null;

    // Added back even though these are not display in the visual formatting settings.  Attempt to fix missing callout values.
    public xOffset?: number = 0;
    public yOffset?: number = 0;
    public invert?: boolean = false;

    // Where percent value is measured against
    public percentType: PercentType = PercentType.endValue;
}

export class CalloutValueVisualSettings {
    public show: boolean = true;
    public color: string = Tachometer.DefaultLabelColor;
    public fontSize?: number = Tachometer.DefaultCalloutFontSizeInPt;
    public labelDisplayUnits?: number = 0;
    public labelPrecision?: number = null;
    public xOffset?: number = null;
    public yOffset?: number = null;
}

export class CalloutPercentVisualSettings {
    public show: boolean = false;
    public color: string = Tachometer.DefaultLabelColor;
    public fontSize?: number = Tachometer.DefaultCalloutPercentFontSizeInPt;
    public labelPrecision?: number = null;
    public xOffset?: number = null;
    public yOffset?: number = null;

    // Where percent value is measured against
    public percentType: PercentType = PercentType.endValue;
    public invert?: boolean = false;
}

export class MarginVisualSettings {
    public top: number = Tachometer.DefaultMarginSettings.top;
    public bottom: number = Tachometer.DefaultMarginSettings.bottom;
    public left: number = Tachometer.DefaultMarginSettings.left;
    public right: number = Tachometer.DefaultMarginSettings.right;
}

export class VisualSettings extends DataViewObjectsParser {
    public axis: AxisVisualSettings = new AxisVisualSettings();
    public rangeDefaults: RangeDefaultSettings = new RangeDefaultSettings();
    public range1: RangeVisualSettings = new RangeVisualSettings();
    public range2: RangeVisualSettings = new RangeVisualSettings();
    public range3: RangeVisualSettings = new RangeVisualSettings();
    public range4: RangeVisualSettings = new RangeVisualSettings();
    public range5: RangeVisualSettings = new RangeVisualSettings();
    public range6: RangeVisualSettings = new RangeVisualSettings();
    public range7: RangeVisualSettings = new RangeVisualSettings();
    public range8: RangeVisualSettings = new RangeVisualSettings();
    public range9: RangeVisualSettings = new RangeVisualSettings();
    public target: TargetVisualSettings = new TargetVisualSettings();
    public indicator: IndicatorVisualSettings = new IndicatorVisualSettings();
    public labels: LabelsVisualSettings = new LabelsVisualSettings();
    public calloutValue: CalloutValueVisualSettings = new CalloutValueVisualSettings();
    public calloutPercent: CalloutPercentVisualSettings = new CalloutPercentVisualSettings();
    public margins: MarginVisualSettings = new MarginVisualSettings();

    public static PARSE_SETTINGS(dataView: DataView): VisualSettings {
        const settings: VisualSettings = this.parse<VisualSettings>(dataView);

        if (settings.rangeDefaults.colorScheme === ColorScheme.redGreenRed) {
            settings.range1.rangeColor = settings.range1.rangeColor === null ? Tachometer.DefaultRange1ColorSchemeRgr : settings.range1.rangeColor;
            settings.range2.rangeColor = settings.range2.rangeColor === null ? Tachometer.DefaultRange2ColorSchemeRgr : settings.range2.rangeColor;
            settings.range3.rangeColor = settings.range3.rangeColor === null ? Tachometer.DefaultRange3ColorSchemeRgr : settings.range3.rangeColor;
            settings.range4.rangeColor = settings.range4.rangeColor === null ? Tachometer.DefaultRange4ColorSchemeRgr : settings.range4.rangeColor;
            settings.range5.rangeColor = settings.range5.rangeColor === null ? Tachometer.DefaultRange5ColorSchemeRgr : settings.range5.rangeColor;
            settings.range6.rangeColor = settings.range6.rangeColor === null ? Tachometer.DefaultRange6ColorSchemeRgr : settings.range6.rangeColor;
            settings.range7.rangeColor = settings.range7.rangeColor === null ? Tachometer.DefaultRange7ColorSchemeRgr : settings.range7.rangeColor;
            settings.range8.rangeColor = settings.range8.rangeColor === null ? Tachometer.DefaultRange8ColorSchemeRgr : settings.range8.rangeColor;
            settings.range9.rangeColor = settings.range9.rangeColor === null ? Tachometer.DefaultRange9ColorSchemeRgr : settings.range9.rangeColor;

        } else {
            settings.range1.rangeColor = settings.range1.rangeColor === null ? Tachometer.DefaultRange1ColorSchemeGrg : settings.range1.rangeColor;
            settings.range2.rangeColor = settings.range2.rangeColor === null ? Tachometer.DefaultRange2ColorSchemeGrg : settings.range2.rangeColor;
            settings.range3.rangeColor = settings.range3.rangeColor === null ? Tachometer.DefaultRange3ColorSchemeGrg : settings.range3.rangeColor;
            settings.range4.rangeColor = settings.range4.rangeColor === null ? Tachometer.DefaultRange4ColorSchemeGrg : settings.range4.rangeColor;
            settings.range5.rangeColor = settings.range5.rangeColor === null ? Tachometer.DefaultRange5ColorSchemeGrg : settings.range5.rangeColor;
            settings.range6.rangeColor = settings.range6.rangeColor === null ? Tachometer.DefaultRange6ColorSchemeGrg : settings.range6.rangeColor;
            settings.range7.rangeColor = settings.range7.rangeColor === null ? Tachometer.DefaultRange7ColorSchemeGrg : settings.range7.rangeColor;
            settings.range8.rangeColor = settings.range8.rangeColor === null ? Tachometer.DefaultRange8ColorSchemeGrg : settings.range8.rangeColor;
            settings.range9.rangeColor = settings.range9.rangeColor === null ? Tachometer.DefaultRange9ColorSchemeGrg : settings.range9.rangeColor;
        }

        return settings;
    }
}
