// import { CreatedFrame, CreateFrame, FontString, IColor, UnitName, WorldFrame } from "../Types/WoWAPI";
import { GlobalData, Settings } from "Settings";
import { IFrameOptions } from "./Interfaces/FrameOptions";
// tslint:disable: variable-name
// Content //

export namespace Interface {
    /** The path to the font file */
    export const Font: string = "Fonts\\FRIZQT__.TTF";

    /** Common colors */
    export namespace Colors {
        export const Black: IColor = { R: 0 / 255, G: 0 / 255, B: 0 / 255, A: 0.8, Hex: "|cff" + "000000" };
        export const ElvUI: IColor = { R: 15 / 255, G: 15 / 255, B: 15 / 255, A: 0.8, Hex: "|cff" + "0F0F0F" };
        export const DarkGray: IColor = { R: 43 / 255, G: 43 / 255, B: 43 / 255, A: 0.8, Hex: "|cff" + "2B2B2B" };
        export const DarkRed: IColor = { R: 127 / 255, G: 0 / 255, B: 0 / 255, A: 0.8, Hex: "|cff" + "7F0000" };
        export const Gray: IColor = { R: 125 / 255, G: 125 / 255, B: 125 / 255, A: 0.8, Hex: "|cff" + "7D7D7D" };
        export const Red: IColor = { R: 159 / 255, G: 4 / 255, B: 8 / 255, A: 0.8, Hex: "|cff" + "9F0408" };
        export const White: IColor = { R: 255 / 255, G: 255 / 255, B: 255 / 255, A: 0.8, Hex: "|cff" + "FFFFFF" };
        export const Green: IColor = { R: 6 / 255, G: 232 / 255, B: 21 / 255, A: 0.8, Hex: "|cff" + "06e815" };


        // Skin
        export const Accent: IColor = { R: 183 / 255, G: 28 / 255, B: 28 / 255, A: 1, Hex: "|cff" + "B71C1C" };
        export const DarkAccent: IColor = { R: 127 / 255, G: 0 / 255, B: 0 / 255, A: 1, Hex: "|cff" + "7F0000" };
        export const Background: IColor = { R: 15 / 255, G: 15 / 255, B: 15 / 255, A: 0.88, Hex: "|cff" + "0F0F0F" };
        export const Border: IColor = { R: 15 / 255, G: 15 / 255, B: 15 / 255, A: 1, Hex: "|cff" + "4F4F4F" };
    }

    let CurrentZIndex: number = 0;
    /** Creates and return a customized frame */
    export function BuildFrame(this: void, options: IFrameOptions): CreatedFrame {
        CurrentZIndex++;
        const Frame: CreatedFrame = CreateFrame(options.Type || "Frame", undefined, options.Parent);
        Frame.Global = options.Global && options.Global || false;
        Frame.Identifier = options.Identifier || "";
        if (!options.Parent) {
            Frame.Draggable = true;
        } else {
            Frame.Parent = options.Parent;
        }
        Frame.Point = options.Point || { Anchor: "CENTER", X: 0, Y: 0 };
        Frame.Size = options.Size || { Width: 100, Height: 30 };
        Frame.SetPoint(Frame.Point.Anchor, options.Parent || WorldFrame, Frame.Point.Anchor, Frame.Point.X, Frame.Point.Y);
        Frame.SetSize(Frame.Size.Width, Frame.Size.Height);
        Frame.SetMovable(true);
        Frame.EnableMouse(true);
        Frame.SetClampedToScreen(true);
        Frame.SetBackdrop({
            bgFile: "Interface\\ChatFrame\\ChatFrameBackground",
            edgeFile: "Interface\\ChatFrame\\ChatFrameBackground",
            edgeSize: 1,
            tile: true,
            tileSize: 1
        });
        /** @noSelf */
        Frame.SetBackground = (color: IColor, borderColor: IColor) => {
            Frame.SetBackdropColor(color.R, color.G, color.G, color.A);
            Frame.SetBackdropBorderColor(borderColor.R, borderColor.G, borderColor.G, borderColor.A);
        };
        Frame.SetBackground(Colors.Background, Colors.Border);
        Frame.SetFrameStrata("LOW");
        Frame.SetFrameLevel(CurrentZIndex);

        Frame.SetScript("OnMouseDown", () => {
            if (Frame.Draggable) {
                const FrameToMove: CreatedFrame = Frame.Parent != undefined && Frame.Parent || Frame;
                FrameToMove.StartMoving();
            }
        });

        Frame.SetScript("OnMouseUp", () => {
            if (Frame.Draggable) {
                const FrameToMove: CreatedFrame = Frame.Parent != undefined && Frame.Parent || Frame;
                FrameToMove.StopMovingOrSizing();
            }
            if (Frame.DropDownFrame != undefined) {
                Frame.DropDownFrame.CloseDropDowns();
            }
        });

        return Frame;
    }

    export function BuildButton(this: void, options: IFrameOptions, color: IColor): CreatedButton {
        const Button: CreatedButton = BuildFrame(options) as CreatedButton;
        Button.SetBackdropColor(color.R, color.G, color.B, color.A);
        Button.OnClick = options.OnClick;
        return Button;
    }

    /** Add a fonstring to an existing frame */
    export function BuildTextString(this: void, frame: CreatedFrame, title: string, position?: string): FontString {
        const Title = frame.CreateFontString("");
        Title.SetPoint(position || "CENTER", frame, position || "CENTER", 0, 0);
        Title.SetFont(Font, 9);
        Title.SetText(title);
        return Title;
    }
}

const MainFrame: CreatedFrame = Interface.BuildFrame({ Identifier: "MainFrame", Point: { Anchor: "CENTER", X: 200, Y: 200 }, Size: { Width: 80, Height: 100 } });
const Button1: CreatedButton = Interface.BuildButton({ Identifier: "Button1", Point: { Anchor: "TOP", X: 0, Y: 0 }, Size: { Width: 80, Height: 20 }, Type: "Button", Parent: MainFrame}, Interface.Colors.Green);
const StatusFrame1: CreatedFrame = Interface.BuildFrame({Identifier: "StatusFrame1", Point: { Anchor: "TOP", X: 0, Y: -20 }, Size: { Width: 80, Height: 20 }, Parent: MainFrame});
const StatusFrame2: CreatedFrame = Interface.BuildFrame({Identifier: "StatusFrame2", Point: { Anchor: "TOP", X: 0, Y: -40 }, Size: { Width: 80, Height: 20 }, Parent: MainFrame});



Settings["bot_active"] = false;
// Add a string to the frame
const StartStopText = Interface.BuildTextString(Button1, "Start");
const StatusText1 = Interface.BuildTextString(StatusFrame1, "We cool");
const StatusText2 = Interface.BuildTextString(StatusFrame2, "No");


let last_status: string = "";
GlobalData["status"] = "No Status";
StatusFrame1.SetScript("OnUpdate", () => {
    if (last_status != GlobalData["status"]) {
     StatusText1.SetText(GlobalData["status"] as string);
     last_status = GlobalData["status"] as string;
}
});
GlobalData["current_waypoint"] = [1, 1, 1];
let last_waypoint: number[] = GlobalData["current_waypoint"] as number[];
StatusFrame2.SetScript("OnUpdate", () => {
    const waypoint = GlobalData["current_waypoint"] as number[];
    if (waypoint == last_waypoint){
        return;
    }
    let out: string = "";
    waypoint.forEach((point) => {
        out += point.toString();
        if (point != waypoint[waypoint.length - 1]){
            out += ", ";
        }
    });
    StatusText2.SetText(out);
    last_waypoint = waypoint;
});

Button1.SetScript("OnClick", () => {
    Settings["bot_active"] = !Settings["bot_active"];
    if (Settings["bot_active"]) {
        Button1.SetBackdropColor(Interface.Colors.DarkAccent.R, Interface.Colors.DarkAccent.G, Interface.Colors.DarkAccent.B, Interface.Colors.DarkAccent.A);
        StartStopText.SetText("Stop");
    } else {
        Button1.SetBackdropColor(Interface.Colors.Green.R, Interface.Colors.Green.G, Interface.Colors.Green.B, Interface.Colors.Green.A);
        StartStopText.SetText("Start");
        Lb.Navigator.Stop();
    }
});
