"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { twMerge as cn } from "tailwind-merge";
import { 
  Package, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ChevronDown,
  ChevronUp,
  Calendar,
  Eye,
  EyeOff
} from "lucide-react";

interface ServiceConfig {
  id?: string; // Notion page ID
  name: string;
  type: "Self-Shoot" | "With Photographer" | "Seasonal Sessions";
  category?: "Classic" | "Digital";
  group: string;
  description: string;
  basePrice: number;
  duration: number;
  availableFrom?: number; // Hour (24-hour format)
  availableUntil?: number; // Hour (24-hour format)
  specificDates?: string[]; // For seasonal services
  enabled: boolean;
  classicPrice?: number; // If different from basePrice + 50
  thumbnail?: string;
}

interface ServiceStats {
  name: string;
  serviceType: string;
  serviceCategory: string;
  count: number;
  totalRevenue: number;
  avgPrice: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [stats, setStats] = useState<ServiceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ServiceConfig | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(["Self-Shoot"]));
  const [showDisabled, setShowDisabled] = useState(false);

  useEffect(() => {
    fetchServicesAndStats();
  }, []);

  const fetchServicesAndStats = async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch("/api/admin/services"),
        fetch("/api/admin/services/config"),
      ]);
      
      const statsData = await statsRes.json();
      setStats(statsData.services || []);
      
      if (configRes.ok) {
        const configData = await configRes.json();
        setServices(configData.services || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...services[index] });
  };

  const startAdd = (type: string) => {
    setEditingIndex(-1);
    setEditForm({
      name: "",
      type: type as any,
      group: "",
      description: "",
      basePrice: 0,
      duration: 45,
      enabled: true,
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveService = async () => {
    if (!editForm) return;

    try {
      const response = await fetch("/api/admin/services/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingIndex === -1 ? "add" : "update",
          service: editForm,
        }),
      });

      if (response.ok) {
        await fetchServicesAndStats();
        cancelEdit();
        alert('Service saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert('Error saving service. Please try again.');
    }
  };

  const deleteService = async (service: ServiceConfig & { id?: string; originalIndex: number }) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch("/api/admin/services/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          service: { id: service.id, name: service.name },
        }),
      });

      if (response.ok) {
        await fetchServicesAndStats();
        alert('Service deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert('Error deleting service. Please try again.');
    }
  };

  const toggleEnabled = async (service: ServiceConfig & { id?: string }) => {
    try {
      const response = await fetch("/api/admin/services/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          service: { ...service, enabled: !service.enabled },
        }),
      });

      if (response.ok) {
        await fetchServicesAndStats();
      } else {
        const error = await response.json();
        alert(`Failed to toggle: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error toggling service:", error);
      alert('Error toggling service. Please try again.');
    }
  };

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const groupedServices = services.reduce((acc, service, index) => {
    if (!showDisabled && !service.enabled) return acc;
    
    if (!acc[service.type]) {
      acc[service.type] = {};
    }
    if (!acc[service.type][service.group]) {
      acc[service.type][service.group] = [];
    }
    acc[service.type][service.group].push({ ...service, originalIndex: index });
    return acc;
  }, {} as Record<string, Record<string, Array<ServiceConfig & { originalIndex: number }>>>);

  const getStatsForService = (serviceName: string) => {
    return stats.find(s => s.name === serviceName);
  };

  const serviceTypes = ["Self-Shoot", "With Photographer", "Seasonal Sessions"];

  const totalStats = {
    totalServices: services.filter(s => s.enabled).length,
    totalBookings: stats.reduce((sum, s) => sum + s.count, 0),
    totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
    avgPrice: stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + s.avgPrice, 0) / stats.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-[#0b3d2e]">Services Management</h1>
          <p className="text-base-body text-neutral-600 mt-1">
            Configure services, pricing, availability, and view booking statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDisabled(!showDisabled)}
          >
            {showDisabled ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showDisabled ? "Hide" : "Show"} Disabled
          </Button>
        </div>
      </div>

      {/* Summary - Dashboard Style */}
      <div>
        <h2 className="text-h2 font-semibold text-[#0b3d2e] mb-3">Summary</h2>
        <Card className="p-6">
          <div className="grid grid-cols-4 gap-4 lg:gap-6">
            {/* Active Services */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                  <Package className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-base-body font-medium text-muted-foreground mb-1">Services</p>
                <p className="text-h3 font-bold text-foreground">{totalStats.totalServices}</p>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-base-body font-medium text-muted-foreground mb-1">Bookings</p>
                <p className="text-h3 font-bold text-foreground">{totalStats.totalBookings}</p>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-base-body font-medium text-muted-foreground mb-1">Revenue</p>
                <p className="text-h3 font-bold text-foreground">₱{totalStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Average Price */}
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-base-body font-medium text-muted-foreground mb-1">Avg. Price</p>
                <p className="text-h3 font-bold text-foreground">₱{totalStats.avgPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Services by Type */}
      {loading ? (
        <Card className="p-8 text-center text-neutral-600">
          Loading services...
        </Card>
      ) : (
        <div className="space-y-4">
          {serviceTypes.map((type) => {
            const isExpanded = expandedTypes.has(type);
            const typeServices = groupedServices[type] || {};
            const typeCount = Object.values(typeServices).flat().length;

            return (
              <Card key={type} className="overflow-hidden">
                {/* Type Header */}
                <div className="w-full p-4 flex items-center justify-between bg-neutral-50 border-b">
                  <button
                    onClick={() => toggleType(type)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Package className="w-5 h-5 text-[#0b3d2e]" />
                    <h2 className="text-h2 font-bold text-[#0b3d2e]">{type}</h2>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {typeCount} service{typeCount !== 1 ? 's' : ''}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-600" />
                    )}
                  </button>
                  <Button
                    size="sm"
                    onClick={() => startAdd(type)}
                    className="bg-[#0b3d2e] hover:bg-[#0a3426] text-h3"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Service
                  </Button>
                </div>

                {/* Type Content */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {Object.keys(typeServices).length === 0 ? (
                      <p className="text-neutral-500 text-center py-4">
                        No services in this category yet
                      </p>
                    ) : (
                      Object.entries(typeServices).map(([group, groupServices]) => (
                        <div key={group}>
                          <h3 className="text-h3 font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                            <span className="w-1 h-4 bg-[#0b3d2e] rounded"></span>
                            {group}
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 ml-3">
                            {groupServices.map((service) => {
                              const serviceStats = getStatsForService(service.name);
                              const isEditing = editingIndex === service.originalIndex;

                              return (
                                <Card
                                  key={service.originalIndex}
                                  className={cn(
                                    "p-4",
                                    !service.enabled && "opacity-60 bg-neutral-50"
                                  )}
                                >
                                  {isEditing && editForm ? (
                                    /* Edit Form */
                                    <div className="space-y-3">
                                      <Input
                                        placeholder="Service Name"
                                        value={editForm.name}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, name: e.target.value })
                                        }
                                      />
                                      <Input
                                        placeholder="Group (e.g., Solo/Duo)"
                                        value={editForm.group}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, group: e.target.value })
                                        }
                                      />
                                      <textarea
                                        className="w-full p-2 border rounded-md text-sm"
                                        rows={3}
                                        placeholder="Description"
                                        value={editForm.description}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, description: e.target.value })
                                        }
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-base-body text-neutral-600">Price (₱)</label>
                                          <Input
                                            type="number"
                                            value={editForm.basePrice}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                basePrice: parseInt(e.target.value),
                                              })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="text-base-body text-neutral-600">Duration (min)</label>
                                          <Input
                                            type="number"
                                            value={editForm.duration}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                duration: parseInt(e.target.value),
                                              })
                                            }
                                          />
                                        </div>
                                      </div>
                                      {type === "With Photographer" && (
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-base-body text-neutral-600">Available From (hour)</label>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="23"
                                              placeholder="e.g., 8"
                                              value={editForm.availableFrom || ""}
                                              onChange={(e) =>
                                                setEditForm({
                                                  ...editForm,
                                                  availableFrom: e.target.value ? parseInt(e.target.value) : undefined,
                                                })
                                              }
                                            />
                                          </div>
                                          <div>
                                            <label className="text-base-body text-neutral-600">Until (hour)</label>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="23"
                                              placeholder="e.g., 18"
                                              value={editForm.availableUntil || ""}
                                              onChange={(e) =>
                                                setEditForm({
                                                  ...editForm,
                                                  availableUntil: e.target.value ? parseInt(e.target.value) : undefined,
                                                })
                                              }
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={saveService}
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                          <Save className="w-4 h-4 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={cancelEdit}
                                          className="flex-1"
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* View Mode */
                                    <>
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h4 className="text-h3 font-semibold text-neutral-900">
                                            {service.name}
                                            {!service.enabled && (
                                              <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                                                Disabled
                                              </Badge>
                                            )}
                                          </h4>
                                          <p className="text-base-body text-neutral-600 mt-1 line-clamp-2">
                                            {service.description}
                                          </p>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => toggleEnabled(service)}
                                            title={service.enabled ? "Disable" : "Enable"}
                                          >
                                            {service.enabled ? (
                                              <Eye className="w-4 h-4 text-green-600" />
                                            ) : (
                                              <EyeOff className="w-4 h-4 text-red-600" />
                                            )}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => startEdit(service.originalIndex)}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => deleteService(service)}
                                          >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2 mt-3">
                                        <div className="text-center p-2 bg-blue-50 rounded">
                                          <DollarSign className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                                          <p className="text-base-body text-neutral-600">Price</p>
                                          <p className="text-h3 font-semibold">₱{service.basePrice}</p>
                                        </div>
                                        <div className="text-center p-2 bg-purple-50 rounded">
                                          <Clock className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                                          <p className="text-base-body text-neutral-600">Duration</p>
                                          <p className="text-h3 font-semibold">{service.duration} min</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded">
                                          <TrendingUp className="w-4 h-4 mx-auto text-green-600 mb-1" />
                                          <p className="text-base-body text-neutral-600">Bookings</p>
                                          <p className="text-h3 font-semibold">
                                            {serviceStats?.count || 0}
                                          </p>
                                        </div>
                                      </div>

                                      {serviceStats && (
                                        <div className="mt-2 pt-2 border-t text-base-body text-neutral-600">
                                          Revenue: <span className="font-semibold text-green-600">₱{serviceStats.totalRevenue.toLocaleString()}</span>
                                          {" • "}
                                          Avg: <span className="font-semibold">₱{Math.round(serviceStats.avgPrice).toLocaleString()}</span>
                                        </div>
                                      )}

                                      {service.availableFrom !== undefined && service.availableUntil !== undefined && (
                                        <div className="mt-2 flex items-center gap-1 text-base-body text-orange-700 bg-orange-50 p-2 rounded">
                                          <Calendar className="w-3 h-3" />
                                          Available {service.availableFrom}:00 - {service.availableUntil}:00 only
                                        </div>
                                      )}
                                    </>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Add New Service Form */}
          {editingIndex === -1 && editForm && (
            <Card className="p-6">
              <h3 className="font-bold text-lg text-[#0b3d2e] mb-4">Add New Service</h3>
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="text-sm font-medium text-neutral-700">Service Type</label>
                  <p className="text-lg font-semibold text-[#0b3d2e]">{editForm.type}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Service Name</label>
                    <Input
                      placeholder="e.g., Solo/Duo 30"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Group</label>
                    <Input
                      placeholder="e.g., Solo/Duo"
                      value={editForm.group}
                      onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Description</label>
                  <textarea
                    className="w-full p-3 border rounded-md"
                    rows={4}
                    placeholder="Service details and inclusions..."
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Base Price (₱)</label>
                    <Input
                      type="number"
                      value={editForm.basePrice}
                      onChange={(e) =>
                        setEditForm({ ...editForm, basePrice: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={editForm.duration}
                      onChange={(e) =>
                        setEditForm({ ...editForm, duration: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
                {editForm.type === "With Photographer" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Available From (hour, 24h format)</label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="e.g., 8 for 8:00 AM"
                        value={editForm.availableFrom || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            availableFrom: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Until (hour, 24h format)</label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="e.g., 18 for 6:00 PM"
                        value={editForm.availableUntil || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            availableUntil: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex gap-3">
                  <Button
                    onClick={saveService}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Service
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-[#0b3d2e] mb-2">
          ℹ️ Service Configuration
        </h3>
        <ul className="space-y-1 text-sm text-neutral-700">
          <li>• Services are organized by Type → Group → Individual Service</li>
          <li>• Classic pricing = Base Price + ₱50 (automatically calculated)</li>
          <li>• Time restrictions (With Photographer) limit availability in booking calendar</li>
          <li>• Disabled services won't appear in customer booking form</li>
          <li>• Booking statistics are calculated from your Notion database</li>
        </ul>
      </Card>
    </div>
  );
}
