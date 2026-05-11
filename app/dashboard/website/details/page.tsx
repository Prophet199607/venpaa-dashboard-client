"use client";

import { useEffect, useState } from "react";
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Globe,
  Mail,
  Clock,
  MapPin,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Link as LinkIcon,
  Upload,
  ImageIcon,
  RefreshCw,
  Bell,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { nodeApi } from "@/utils/api-node";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { FaXTwitter } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Types ---

interface SocialLink {
  platform: string;
  url: string;
}

interface Logo {
  type: string;
  url: string;
}

interface Location {
  name: string;
  address: string;
  map_link: string;
  phone: string;
}

interface NavbarMessage {
  text: string;
  is_active: boolean;
  link?: string;
}

interface WebsiteDetails {
  email: string;
  phone: string;
  about_us: string;
  opening_hours: string;
  social_links: SocialLink[];
  logos: Logo[];
  locations: Location[];
  navbar_messages: NavbarMessage[];
}

const PLATFORMS = [
  { name: "Facebook", icon: Facebook },
  { name: "Instagram", icon: Instagram },
  { name: "X", icon: FaXTwitter },
  { name: "LinkedIn", icon: Linkedin },
  { name: "YouTube", icon: Youtube },
  { name: "GitHub", icon: Github },
  { name: "Other", icon: LinkIcon },
];

const LOGO_TYPES = [
  {
    id: "header",
    label: "Header Logo",
    description: "Displayed at the top of the website",
  },
  {
    id: "footer",
    label: "Footer Logo",
    description: "Displayed at the bottom of the website",
  },
  {
    id: "mobile",
    label: "Mobile Logo",
    description: "Displayed on mobile devices",
  },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function WebsiteDetailsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [details, setDetails] = useState<WebsiteDetails>({
    email: "",
    phone: "",
    about_us: "",
    opening_hours: "",
    social_links: [],
    logos: [],
    locations: [],
    navbar_messages: [],
  });

  const [originalDetails, setOriginalDetails] = useState<WebsiteDetails | null>(
    null,
  );

  // --- Fetch Data ---
  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await nodeApi.get("/website-details");
      const data = response.data?.data || response.data;

      const sanitizedData: WebsiteDetails = {
        email: data.email || "",
        phone: data.phone || "",
        about_us: data.about_us || "",
        opening_hours: data.opening_hours || "",
        social_links: Array.isArray(data.social_links) ? data.social_links : [],
        logos: Array.isArray(data.logos) ? data.logos : [],
        locations: Array.isArray(data.locations) ? data.locations : [],
        navbar_messages: Array.isArray(data.navbar_messages)
          ? data.navbar_messages
          : [],
      };

      setDetails(sanitizedData);
      setOriginalDetails(sanitizedData);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to fetch website details", error);
      // If 404, it might be the first time, so we keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  // --- Handlers ---

  const handleChange = (field: keyof WebsiteDetails, value: any) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await nodeApi.put("/website-details", details);
      setOriginalDetails(details);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Website details updated successfully.",
        type: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update details.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalDetails) {
      setDetails(originalDetails);
      setHasChanges(false);
      toast({
        title: "Changes discarded",
        description: "Reverted to the last saved state.",
      });
    }
  };

  // --- Social Links Handlers ---
  const addSocialLink = () => {
    handleChange("social_links", [
      ...details.social_links,
      { platform: "Facebook", url: "" },
    ]);
  };

  const removeSocialLink = (index: number) => {
    const updated = details.social_links.filter((_, i) => i !== index);
    handleChange("social_links", updated);
  };

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string,
  ) => {
    const updated = details.social_links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link,
    );
    handleChange("social_links", updated);
  };

  // --- Locations Handlers ---
  const addLocation = () => {
    handleChange("locations", [
      ...details.locations,
      { name: "", address: "", map_link: "", phone: "" },
    ]);
  };

  const removeLocation = (index: number) => {
    const updated = details.locations.filter((_, i) => i !== index);
    handleChange("locations", updated);
  };

  const updateLocation = (
    index: number,
    field: keyof Location,
    value: string,
  ) => {
    const updated = details.locations.map((loc, i) =>
      i === index ? { ...loc, [field]: value } : loc,
    );
    handleChange("locations", updated);
  };

  // --- Logo Handlers ---
  const updateLogoUrl = async (type: string, value: string | File) => {
    let url = "";
    if (typeof value === "string") {
      url = value;
    } else {
      if (value.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "The image exceeds the 5MB size limit. Please upload a smaller image.",
          type: "error",
        });
        return;
      }
      try {
        url = await fileToBase64(value);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process image file.",
          type: "error",
        });
        return;
      }
    }

    const existing = details.logos.find((l) => l.type === type);
    let updated;
    if (existing) {
      updated = details.logos.map((l) => (l.type === type ? { ...l, url } : l));
    } else {
      updated = [...details.logos, { type, url }];
    }
    handleChange("logos", updated);
  };

  // --- Navbar Messages Handlers ---
  const addNavbarMessage = () => {
    handleChange("navbar_messages", [
      ...details.navbar_messages,
      { text: "", is_active: true, link: "" },
    ]);
  };

  const removeNavbarMessage = (index: number) => {
    const updated = details.navbar_messages.filter((_, i) => i !== index);
    handleChange("navbar_messages", updated);
  };

  const updateNavbarMessage = (
    index: number,
    field: keyof NavbarMessage,
    value: any,
  ) => {
    const updated = details.navbar_messages.map((msg, i) =>
      i === index ? { ...msg, [field]: value } : msg,
    );
    handleChange("navbar_messages", updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <Loader />
        <p>Loading website details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Website Details
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage your website&apos;s contact info, logos, social links, and
            locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchDetails}
            disabled={saving}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Discard
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2 min-w-[140px]"
          >
            {saving ? <Loader /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 md:grid-cols-5 mb-8">
          <TabsTrigger value="general" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="logos" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Logos
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Facebook className="w-4 h-4" />
            Social Links
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="w-4 h-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <Bell className="w-4 h-4" />
            Navbar Messages
          </TabsTrigger>
        </TabsList>

        {/* General Info Tab */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    placeholder="info@example.com"
                    value={details.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+94 77 123 4567"
                    value={details.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="pl-12"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Opening Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="opening_hours">Hours of Operation</Label>
                  <Textarea
                    id="opening_hours"
                    placeholder="Mon - Fri: 9:00 AM - 6:00 PM&#10;Sat: 9:00 AM - 1:00 PM&#10;Sun: Closed"
                    rows={5}
                    value={details.opening_hours}
                    onChange={(e) =>
                      handleChange("opening_hours", e.target.value)
                    }
                    className="resize-none font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  About Us Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Venpa Bookshop started with a passion for literature..."
                  rows={8}
                  value={details.about_us}
                  onChange={(e) => handleChange("about_us", e.target.value)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LOGO_TYPES.map((logo) => {
              const currentLogo = details.logos.find((l) => l.type === logo.id);
              return (
                <Card
                  key={logo.id}
                  className="border-none shadow-md overflow-hidden group"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{logo.label}</CardTitle>
                    <CardDescription className="text-xs">
                      {logo.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="aspect-[3/1] relative rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 group-hover:border-primary/30 transition-colors">
                      {currentLogo?.url ? (
                        <div className="relative w-full h-full p-4 flex items-center justify-center">
                          <Image
                            src={currentLogo.url}
                            alt={logo.label}
                            fill
                            unoptimized
                            className="object-contain p-4"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => updateLogoUrl(logo.id, "")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-[10px] text-muted-foreground">
                            No logo set
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Logo URL</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://..."
                          value={currentLogo?.url || ""}
                          onChange={(e) =>
                            updateLogoUrl(logo.id, e.target.value)
                          }
                          className="text-xs"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`file-${logo.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) updateLogoUrl(logo.id, file);
                            }}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="shrink-0 h-9 w-9"
                            onClick={() =>
                              document
                                .getElementById(`file-${logo.id}`)
                                ?.click()
                            }
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Social Media Profiles
                  </CardTitle>
                </div>
                <Button onClick={addSocialLink} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Link
                </Button>
              </CardHeader>
              <CardContent>
                {details.social_links.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl">
                    <Facebook className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No social links added yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {details.social_links.map((link, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <div className="w-full sm:w-[180px]">
                          <select
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            value={link.platform}
                            onChange={(e) =>
                              updateSocialLink(
                                index,
                                "platform",
                                e.target.value,
                              )
                            }
                          >
                            {PLATFORMS.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="relative flex-1 w-full">
                          <Input
                            placeholder="https://facebook.com/yourstore"
                            value={link.url}
                            onChange={(e) =>
                              updateSocialLink(index, "url", e.target.value)
                            }
                            className="pl-10"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSocialLink(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none max-h-[150px] shadow-md bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Social Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 justify-center py-6">
                {details.social_links.filter((l) => l.url).length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">
                    Add links to see preview
                  </p>
                ) : (
                  details.social_links
                    .filter((l) => l.url)
                    .map((link, idx) => {
                      const platform =
                        PLATFORMS.find((p) => p.name === link.platform) ||
                        PLATFORMS[PLATFORMS.length - 1];
                      const Icon = platform.icon;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-2 group cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-sm border flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                            {link.platform}
                          </span>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-end mb-2">
            <Button onClick={addLocation} className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Add New Location
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {details.locations.length === 0 ? (
              <div className="lg:col-span-2 text-center py-20 border border-dashed rounded-2xl bg-neutral-50/30 dark:bg-neutral-900/10">
                <MapPin className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No locations listed</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your physical store branches here.
                </p>
              </div>
            ) : (
              details.locations.map((loc, index) => (
                <Card
                  key={index}
                  className="border-none shadow-lg bg-white dark:bg-neutral-900 relative group overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          BRANCH #{index + 1}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(index)}
                        className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                        Branch Name
                      </Label>
                      <Input
                        placeholder="e.g., Main Branch - Colombo"
                        value={loc.name}
                        onChange={(e) =>
                          updateLocation(index, "name", e.target.value)
                        }
                        className="font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                          Address
                        </Label>
                        <div className="relative">
                          <Textarea
                            placeholder="123 Bookstore St, Colombo 03"
                            value={loc.address}
                            onChange={(e) =>
                              updateLocation(index, "address", e.target.value)
                            }
                            className="pl-10 resize-none h-20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Input
                            placeholder="+94 11 234 5678"
                            value={loc.phone}
                            onChange={(e) =>
                              updateLocation(index, "phone", e.target.value)
                            }
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                          Google Maps Link
                        </Label>
                        <div className="relative">
                          <Input
                            placeholder="https://goo.gl/maps/..."
                            value={loc.map_link}
                            onChange={(e) =>
                              updateLocation(index, "map_link", e.target.value)
                            }
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Navbar Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Website Navbar Messages
                </CardTitle>
              </div>
              <Button onClick={addNavbarMessage} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Message
              </Button>
            </CardHeader>
            <CardContent>
              {details.navbar_messages.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl">
                  <Bell className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No navbar messages added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {details.navbar_messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        msg.is_active
                          ? "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm"
                          : "border-neutral-100 bg-neutral-50/50 dark:border-neutral-900/50 dark:bg-neutral-950 opacity-60",
                      )}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="flex-1 w-full space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                Message Text
                              </Label>
                              <Input
                                placeholder="Free shipping on orders over Rs. 5000!"
                                value={msg.text}
                                onChange={(e) =>
                                  updateNavbarMessage(
                                    index,
                                    "text",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                Link (Optional)
                              </Label>
                              <div className="relative">
                                <Input
                                  placeholder="https://..."
                                  value={msg.link || ""}
                                  onChange={(e) =>
                                    updateNavbarMessage(
                                      index,
                                      "link",
                                      e.target.value,
                                    )
                                  }
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center gap-2 self-stretch justify-between sm:justify-start">
                          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg">
                            <Checkbox
                              id={`active-${index}`}
                              checked={msg.is_active}
                              onCheckedChange={(checked) =>
                                updateNavbarMessage(index, "is_active", checked)
                              }
                            />
                            <Label
                              htmlFor={`active-${index}`}
                              className="text-xs cursor-pointer"
                            >
                              {msg.is_active ? (
                                <span className="text-green-600 font-bold">
                                  Active
                                </span>
                              ) : (
                                <span className="text-neutral-400">
                                  Inactive
                                </span>
                              )}
                            </Label>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeNavbarMessage(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
