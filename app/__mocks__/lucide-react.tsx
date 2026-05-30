// Test mock for lucide-react — returns lightweight SVG stubs without
// calling React.useContext (which breaks when multiple React instances exist).
import React from "react";

function makeSvgIcon(name: string) {
  const Icon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
    ({ className, ...props }, ref) => (
      <svg
        ref={ref}
        data-testid={`icon-${name}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        {...props}
      />
    )
  );
  Icon.displayName = name;
  return Icon;
}

// The Proxy handles any named import (e.g. import { Flame } from "lucide-react")
const iconProxy = new Proxy(
  {} as Record<string, ReturnType<typeof makeSvgIcon>>,
  { get(_t, prop: string) { return makeSvgIcon(prop); } }
);

export const Flame = makeSvgIcon("Flame");
export const MapPin = makeSvgIcon("MapPin");
export const Shield = makeSvgIcon("Shield");
export const Ban = makeSvgIcon("Ban");
export const BarChart3 = makeSvgIcon("BarChart3");
export const BarChart2 = makeSvgIcon("BarChart2");
export const TrendingUp = makeSvgIcon("TrendingUp");
export const Zap = makeSvgIcon("Zap");
export const ChevronDown = makeSvgIcon("ChevronDown");
export const ChevronUp = makeSvgIcon("ChevronUp");
export const ChevronLeft = makeSvgIcon("ChevronLeft");
export const ChevronRight = makeSvgIcon("ChevronRight");
export const ShieldAlert = makeSvgIcon("ShieldAlert");
export const Sparkles = makeSvgIcon("Sparkles");
export const X = makeSvgIcon("X");
export const AlertTriangle = makeSvgIcon("AlertTriangle");
export const AlertCircle = makeSvgIcon("AlertCircle");
export const Info = makeSvgIcon("Info");
export const Check = makeSvgIcon("Check");
export const CheckCircle = makeSvgIcon("CheckCircle");
export const Circle = makeSvgIcon("Circle");
export const Clock = makeSvgIcon("Clock");
export const Download = makeSvgIcon("Download");
export const ExternalLink = makeSvgIcon("ExternalLink");
export const Eye = makeSvgIcon("Eye");
export const EyeOff = makeSvgIcon("EyeOff");
export const Filter = makeSvgIcon("Filter");
export const Hash = makeSvgIcon("Hash");
export const Home = makeSvgIcon("Home");
export const Inbox = makeSvgIcon("Inbox");
export const Layout = makeSvgIcon("Layout");
export const Link = makeSvgIcon("Link");
export const List = makeSvgIcon("List");
export const Lock = makeSvgIcon("Lock");
export const LogIn = makeSvgIcon("LogIn");
export const LogOut = makeSvgIcon("LogOut");
export const Mail = makeSvgIcon("Mail");
export const Menu = makeSvgIcon("Menu");
export const MessageSquare = makeSvgIcon("MessageSquare");
export const Moon = makeSvgIcon("Moon");
export const MoreHorizontal = makeSvgIcon("MoreHorizontal");
export const MoreVertical = makeSvgIcon("MoreVertical");
export const Package = makeSvgIcon("Package");
export const Plus = makeSvgIcon("Plus");
export const RefreshCw = makeSvgIcon("RefreshCw");
export const Search = makeSvgIcon("Search");
export const Settings = makeSvgIcon("Settings");
export const Share = makeSvgIcon("Share");
export const Star = makeSvgIcon("Star");
export const Sun = makeSvgIcon("Sun");
export const Tag = makeSvgIcon("Tag");
export const Trash = makeSvgIcon("Trash");
export const Unlock = makeSvgIcon("Unlock");
export const Upload = makeSvgIcon("Upload");
export const User = makeSvgIcon("User");
export const Users = makeSvgIcon("Users");
export const XCircle = makeSvgIcon("XCircle");
export const Layers = makeSvgIcon("Layers");
export const Activity = makeSvgIcon("Activity");
export const Globe = makeSvgIcon("Globe");
export const Bell = makeSvgIcon("Bell");
export const ArrowUp = makeSvgIcon("ArrowUp");
export const ArrowDown = makeSvgIcon("ArrowDown");
export const ArrowLeft = makeSvgIcon("ArrowLeft");
export const ArrowRight = makeSvgIcon("ArrowRight");
export const Loader = makeSvgIcon("Loader");
export const Loader2 = makeSvgIcon("Loader2");
export const PlusCircle = makeSvgIcon("PlusCircle");
export const MinusCircle = makeSvgIcon("MinusCircle");
export const Command = makeSvgIcon("Command");
export const Cpu = makeSvgIcon("Cpu");
export const Database = makeSvgIcon("Database");
export const Server = makeSvgIcon("Server");
export const Cloud = makeSvgIcon("Cloud");
export const CloudRain = makeSvgIcon("CloudRain");
export const Wind = makeSvgIcon("Wind");
export const Thermometer = makeSvgIcon("Thermometer");
export const Droplets = makeSvgIcon("Droplets");
export const Timer = makeSvgIcon("Timer");
export const Map = makeSvgIcon("Map");
export const LayoutDashboard = makeSvgIcon("LayoutDashboard");
export const AlertOctagon = makeSvgIcon("AlertOctagon");
export const SlidersHorizontal = makeSvgIcon("SlidersHorizontal");
export const MessageCircle = makeSvgIcon("MessageCircle");
export const Mic = makeSvgIcon("Mic");
export const FileText = makeSvgIcon("FileText");
export const Volume2 = makeSvgIcon("Volume2");
export const Tree = makeSvgIcon("Tree");
export const Maximize2 = makeSvgIcon("Maximize2");
export const Minimize2 = makeSvgIcon("Minimize2");
export const PanelLeftClose = makeSvgIcon("PanelLeftClose");
export const PanelLeftOpen = makeSvgIcon("PanelLeftOpen");
export const PanelRightClose = makeSvgIcon("PanelRightClose");
export const PanelRightOpen = makeSvgIcon("PanelRightOpen");
export const Crosshair = makeSvgIcon("Crosshair");
export const Navigation = makeSvgIcon("Navigation");
export const Target = makeSvgIcon("Target");
export const TrendingDown = makeSvgIcon("TrendingDown");
export const AreaChart = makeSvgIcon("AreaChart");
export const LineChart = makeSvgIcon("LineChart");
export const PieChart = makeSvgIcon("PieChart");

export default iconProxy;
