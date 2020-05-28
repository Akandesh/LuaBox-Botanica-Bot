import { GlobalData, Settings } from "Settings";
// Content //
Lb.LoadScript("TypescriptNavigator");

enum ObjectType {
    Object = 0,
    Item = 1,
    Container = 2,
    AzeriteEmpoweredItem = 3,
    AzeriteItem = 4,
    Unit = 5,
    Player = 6,
    ActivePlayer = 7,
    GameObject = 8,
    DynamicObject = 9,
    Corpse = 10,
    AreaTrigger = 11,
    SceneObject = 12,
    ConversationData = 13
}

// tslint:disable: variable-name
const bot_frame: CreatedFrame = CreateFrame("Frame", "mainframe");
const drawing_frame: CreatedFrame = CreateFrame("Frame", "drawing_frame");

function Dump(value: any): any {
    _G.TestDump = value;
    RunMacroText("/dump TestDump");
}

function unit_is_boss(unit: string): boolean {
    if (UnitIsUnit(unit, "Boss1") || UnitIsUnit(unit, "Boss2") || UnitIsUnit(unit, "Boss3") || UnitIsUnit(unit, "Boss4") || UnitIsUnit(unit, "Boss5")) {
        return true;
    }
    return false;
}

let last_tick_time = 0;
const entrance_location = {x: 3417, y: 1480, z: 184};
const last_boss_location = {x: 62, y: 391, z: -27};
const exit_dungeon_location = {x: 169.9, y: 391.63, z: -37.96};
let current_waypoint: [number, number, number] = [0, 0, 0];
let kill_and_loot: boolean = false;
let looted: boolean = false;
let started_dungeon_run = false;
let run_out = false;

let should_enter = false;

const excluded_items: string[] = ["Blade of Wizardry", "The Night Blade", "Blinkstrike"];

function item_excluded(name: string): boolean {
    for (let i = 0; i < excluded_items.length; i++) {
        if (name == excluded_items[i]) {
            return true;
        }
    }
    return false;
}

const HORDE_MOUNT_VENDOR = 32641;

drawing_frame.SetScript("OnUpdate", () => {
    if (!Settings["bot_active"] ) {
        Lb.Draw.ClearCanvas();
        return;
    }
    if (current_waypoint == [0, 0, 0]) {
        Lb.Draw.ClearCanvas();
        return;
    }
    if (GlobalData["current_waypoint"] as number[] != current_waypoint) {
       GlobalData["current_waypoint"] = current_waypoint;
    }
    Lb.Draw.ClearCanvas();
    const my_position = Lb.ObjectPosition("player");
    const paths = Lb.NavMgr_GetPath(current_waypoint[0], current_waypoint[1], current_waypoint[2]);
    let last_path: {x: number, y: number, z: number} = {x: 0, y: 0, z: 0};
    for (let i = 1; paths[i] != undefined; i++) {
        const path = paths[i];
        if (i == 1) {
            Lb.Draw.Line(my_position[0], my_position[1], my_position[2], path.x, path.y, path.z, 1);
        } else {
            Lb.Draw.Line(last_path.x, last_path.y, last_path.z, path.x, path.y, path.z, 1);
        }
        last_path = path;
    }
});

function navigate_to(x: number, y: number, z: number): void {
    current_waypoint = [x, y, z];
    const paths = Lb.NavMgr_GetPath(x, y, z);
    const my_position = Lb.ObjectPosition("player");
    let i = 1;
    while (paths[i] != undefined) {
        const path = paths[i];
        const distance = Lb.math.distance3d(my_position[0], my_position[1], my_position[2], path.x, path.y, path.z);
        if (distance < 1) {
            i++;
        } else {
            Lb.MoveTo(path.x, path.y, path.z);
            break;
        }
    }
}

function sort_by_distance(n1: string, n2: string): number {
    const my_position = Lb.ObjectPosition("player");
    const position1 = Lb.ObjectPosition(n1);
    const position2 = Lb.ObjectPosition(n2);

    const distance1 = Lb.math.distance3d(my_position[0], my_position[1], my_position[2], position1[0], position1[1], position1[2]);
    const distance2 = Lb.math.distance3d(my_position[0], my_position[1], my_position[2], position2[0], position2[1], position2[2]);

    if (distance1 < distance2) {
        return -1;
    }
    if (distance1 > distance2) {
        return 1;
    }
    return 0;
}

function navigate_to_dungeon(): void {

}

function engage_combat(): void {
    if (!IsAutoRepeatSpell(GetSpellInfo(6603)[0])) {
        RunMacroText("/StartAttack");
    }
    if (IsUsableSpell(258920)) { // immoliation aura
        CastSpellByName("Immolation Aura");
    }
}

function navigate_dungeon(): void {
    // Array of nearby units
    const my_position = Lb.ObjectPosition("player");

    let obj: string[] = Lb.GetObjects(100, ObjectType.Unit);
    obj = obj.sort(sort_by_distance);
    let going_to_unit: boolean = false;
    if (!run_out) {
        for (let i = 0; i < obj.length; i++) {
            const object = obj[i];
            if (unit_is_boss(object)) {
                GlobalData["status"] = "Killing errybody";
                looted = false;
                kill_and_loot = true;
                if (!UnitIsDead(object)) {
                    const [posx, posy, posz] = Lb.ObjectPosition(object); // posz += 2;
                    navigate_to(posx, posy, posz);
                    TargetUnit(object);
                    engage_combat();
                }
            } else if (!kill_and_loot && !UnitAffectingCombat(object) && UnitCanAttack("player", object) && !UnitIsDead(object)) {
                    const [posx, posy, posz] = Lb.ObjectPosition(object); // posz += 2;
                    going_to_unit = true;
                    navigate_to(posx, posy, posz);
                    break;
            } else if (kill_and_loot && UnitAffectingCombat(object) && UnitCanAttack("player", object) && !UnitIsDead(object)) {
                const [posx, posy, posz] = Lb.ObjectPosition(object); // posz += 2;
                going_to_unit = true;
                navigate_to(posx, posy, posz);
                TargetUnit(object);
                engage_combat();
            }
        }
    }

    if ( !going_to_unit ) {
        let found_lootable = false;
        for (let i = 0; i < obj.length; i++) {
            const object = obj[i];
            if (UnitIsDead(object) && Lb.UnitIsLootable(object)) {
                found_lootable = true;
                if (GetNumLootItems()) {
                    const [posx, posy, posz] = Lb.ObjectPosition(object); // posz += 2;
                    navigate_to(posx, posy, posz);
                    GlobalData["status"] = "Looting";
                    TargetUnit(object);
                    Lb.ObjectInteract(object);
                    kill_and_loot = true;
                    break;
                }
            }
        }
        if (!found_lootable) {
            looted = true;
            if (!kill_and_loot ) {
                const distance = Lb.math.distance3d(my_position[0], my_position[1], my_position[2], last_boss_location.x, last_boss_location.y, last_boss_location.z);
                if (distance < 3) {
                    run_out = true;
                }
            }
        }
    }

    if (going_to_unit && !kill_and_loot) {
        GlobalData["status"] = "Going to unit.";
    } else if (!kill_and_loot && !run_out) {
        GlobalData["status"] = "Going to last boss.";
        navigate_to(last_boss_location.x, last_boss_location.y, last_boss_location.z);
    } else if (run_out) {
        GlobalData["status"] = "Exiting Dungeon.";
        navigate_to(exit_dungeon_location.x, exit_dungeon_location.y, exit_dungeon_location.z);
    }

    if (!going_to_unit && kill_and_loot) {
        if (looted) {
            kill_and_loot = false;
        }
    }

}

let previous_vendor_guid = "";
function vendor_everything() {
    if (should_enter) {
        return;
    }
    GlobalData["status"] = "Vendoring";
    const obj: string[] = Lb.GetObjects(5, ObjectType.Unit);
    // See if existing vendor.. exists
    if (!UnitExists(previous_vendor_guid)) {
        for (let i = 0; i < obj.length; i++) {
            const object = obj[i];
            const object_id = Lb.ObjectId(object);
            if (object_id == HORDE_MOUNT_VENDOR) {
                previous_vendor_guid = object;
            }
        }
    }
    // Mount up and get your own vendor lol
    if (!UnitExists(previous_vendor_guid)) {
        // TODO: Mount up
        vendor_everything();
        return;
    }

    TargetUnit(previous_vendor_guid);
    if (!MerchantFrame.IsVisible()) {
        Lb.ObjectInteract(previous_vendor_guid);
    }
    if (CanMerchantRepair()) {
        RepairAllItems();
    }

    let had_to_sell = false;
    if (MerchantFrame.IsVisible()) {
        for (let i = 0; i < 5; i++) {
            const slot_count = GetContainerNumSlots(i);
            for (let v = 0; v < slot_count; v++) {
                const item_info = GetContainerItemInfo(i, v);
                if (!item_info[2]) {
                    const item_name = GetItemInfo(item_info[9])[0];
                    if (!item_excluded(item_name)) {
                        UseContainerItem(i, v);
                        had_to_sell = true;
                    }
                }
            }
        }
    }

    if (!had_to_sell) {
        should_enter = true;
    }

}

bot_frame.SetScript("OnUpdate", () => {
    if (!Settings["bot_active"]) {
        return;
    }
    if ((GetTime() - last_tick_time) < 0.1) {
        return;
    }
    const current_map = C_Map.GetBestMapForUnit("player");
    if ( current_map == 109) { // netherstorm
        if (GlobalData["status"] == "Vendoring") {
            vendor_everything();
            if (should_enter) {
                if (started_dungeon_run) {
                    ResetInstances();
                    started_dungeon_run = false;
                }
                navigate_to(entrance_location.x, entrance_location.y, entrance_location.z);
            }
            return;
        } else if (GlobalData["status"] == "Exiting Dungeon.") {
            GlobalData["status"] = "Vendoring";
        }
        // navigate_to_dungeon();
    } else if (current_map == 266) { // botanica
        if (!started_dungeon_run) {
            started_dungeon_run = true;
            should_enter = false;
        }
        navigate_dungeon();
    }
    last_tick_time = GetTime();
});
