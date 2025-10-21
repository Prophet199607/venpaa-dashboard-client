"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Building,
  Truck,
  Mail,
  Phone,
  Globe,
  FileText,
  Building2,
  Smartphone,
  PhoneCall,
  MapPinHouse,
  ExternalLink,
} from "lucide-react";

interface DetailItem {
  icon: React.ComponentType<any>;
  title: string;
  value: any;
  type?: "text" | "email" | "website";
}

interface DetailsPanelProps {
  data: Record<string, any>;
  type: "author" | "publisher" | "supplier";
}

const iconMap = {
  // Common icons
  email: Mail,
  contact: Phone,
  website: Globe,
  address: MapPinHouse,
  description: FileText,
  mobile: Smartphone,
  telephone: PhoneCall,
  company: Building2,

  // Type specific
  auth_name_tamil: User,
  pub_name: Building,
  sup_name: Truck,
};

export function DetailsPanel({ data, type }: DetailsPanelProps) {
  const getFieldConfig = (): DetailItem[] => {
    const config: Record<string, Partial<DetailItem>> = {
      // Author specific fields
      auth_name_tamil: {
        icon: User,
        title: "Tamil Name",
        type: "text",
      },

      // Publisher specific fields
      website: {
        icon: Globe,
        title: "Website",
        type: "website",
      },
      address: {
        icon: MapPinHouse,
        title: "Address",
        type: "text",
      },
      contact: {
        icon: Phone,
        title: "Contact",
        type: "text",
      },
      email: {
        icon: Mail,
        title: "Email",
        type: "email",
      },

      // Supplier specific fields
      company: {
        icon: Building2,
        title: "Company",
        type: "text",
      },
      mobile: {
        icon: Smartphone,
        title: "Mobile",
        type: "text",
      },
      telephone: {
        icon: PhoneCall,
        title: "Telephone",
        type: "text",
      },

      // Common fields
      description: {
        icon: FileText,
        title: "Description",
        type: "text",
      },
    };

    const items: DetailItem[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (
        !value ||
        key.endsWith("_url") ||
        key.endsWith("_image") ||
        key === "id" ||
        key === "created_by" ||
        key === "updated_by" ||
        (key.includes("_name") && key !== "auth_name_tamil") ||
        key.includes("_code")
      ) {
        return;
      }

      const fieldConfig = config[key];
      if (fieldConfig) {
        items.push({
          icon: fieldConfig.icon || FileText,
          title:
            fieldConfig.title ||
            key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value: renderValue(value),
          type: fieldConfig.type || "text",
        });
      }
    });

    return items;
  };

  const renderValue = (value: any): string => {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (value instanceof Date) return value.toLocaleDateString();
    if (value === null || value === undefined) return "-";
    if (value === "") return "-";
    return String(value);
  };

  const handleClick = (item: DetailItem, value: string) => {
    if (item.type === "website") {
      // Ensure URL has protocol
      const url = value.startsWith("http") ? value : `https://${value}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (item.type === "email") {
      const email = value.trim();
      if (email.includes("@")) {
        // Alternative Gmail compose URL
        const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(
          email
        )}`;
        window.open(gmailUrl, "_blank", "noopener,noreferrer");
      }
      // } else if (item.type === "email") {
      //   const email = value.trim();
      //   if (email.includes("@")) {
      //     const gmailUrl = `https://mail.google.com/mail/u/0/#inbox?compose=new&to=${encodeURIComponent(
      //       email
      //     )}`;
      //     window.open(gmailUrl, "_blank", "noopener,noreferrer");
      //   }
    }
  };

  const detailItems = getFieldConfig();

  if (detailItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No additional details available
      </div>
    );
  }

  return (
    <ScrollArea className="w-full max-h-[300px] rounded-lg border bg-card/50 backdrop-blur-sm p-2">
      <div>
        {detailItems.map((item, index) => (
          <DetailItem
            key={index}
            {...item}
            onClick={() => handleClick(item, item.value)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface DetailItemProps extends DetailItem {
  onClick?: () => void;
}

function DetailItem({
  icon: Icon,
  title,
  value,
  type = "text",
  onClick,
}: DetailItemProps) {
  const isClickable = type === "website" || type === "email";
  const isValidValue = value && value !== "-" && value !== "";

  return (
    <div
      className={`flex items-start space-x-3 p-3 rounded-md transition-colors group ${
        isClickable && isValidValue
          ? "hover:bg-accent/50 cursor-pointer"
          : "hover:bg-accent/30"
      } ${!isValidValue ? "opacity-50" : ""}`}
      onClick={isClickable && isValidValue ? onClick : undefined}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-primary/10 group-hover:bg-primary/20">
        <Icon className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`text-sm font-semibold leading-relaxed ${
              isClickable && isValidValue
                ? "text-primary hover:underline"
                : "text-foreground"
            }`}
          >
            {value}
          </div>

          {isClickable && isValidValue && (
            <ExternalLink className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {isClickable && isValidValue && (
          <div className="text-xs text-muted-foreground mt-1">
            {type === "website" && "Click to visit website"}
            {type === "email" && "Click to open Gmail"}
          </div>
        )}
      </div>
    </div>
  );
}
