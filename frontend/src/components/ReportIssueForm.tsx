import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, MapPin, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import apiService from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const ReportIssueForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(false); // Temporarily start with Supabase due to RLS issues
  const [retryAttempted, setRetryAttempted] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Retry logic when backend preference changes
  useEffect(() => {
    if (pendingFormData && !useBackend && retryAttempted) {
      // Automatically retry with Supabase after backend failed
      const retrySubmit = async () => {
        await handleSubmitInternal(pendingFormData);
        setPendingFormData(null);
      };
      retrySubmit();
    }
  }, [useBackend, retryAttempted, pendingFormData]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast({
            title: "Location captured",
            description: "Your current location has been added to the report.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your current location. Please enter it manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('issue-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('issue-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to report an issue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (!title || !description || !category || !location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      title,
      description,
      category,
      priority,
      location,
      coordinates,
      photo,
      user
    };

    await handleSubmitInternal(formData);
  };

  const handleSubmitInternal = async (formData: any) => {
    const { title, description, category, priority, location, coordinates, photo, user } = formData;
    
    setLoading(true);

    try {
      let imageUrl = null;
      // Temporarily skip image upload due to RLS policy issues
      // if (photo) {
      //   imageUrl = await uploadPhoto(photo);
      // }

      const issueData = {
        title,
        description,
        category,
        priority,
        location_description: location,
        location_coordinates: coordinates 
          ? `POINT(${coordinates.lng} ${coordinates.lat})`
          : null,
        image_url: imageUrl,
        user_id: user.id,
      };

      if (useBackend) {
        // Use backend API
        console.log("Creating issue via Backend API...");
        const response = await apiService.createIssue(issueData);

        if (response.success) {
          toast({
            title: "Issue Reported!",
            description: "Thank you for reporting this issue. We'll review it soon.",
          });
          
          // Reset form on success
          setTitle("");
          setDescription("");
          setCategory("");
          setPriority("medium");
          setLocation("");
          setCoordinates(null);
          setPhoto(null);
          setPhotoPreview(null);
          setRetryAttempted(false);
          setPendingFormData(null);
        } else {
          throw new Error(response.message || "Failed to create issue");
        }
      } else {
        // Fallback to direct Supabase
        console.log("Creating issue via Supabase...");
        const { error } = await supabase
          .from('civic_issues')
          .insert(issueData);

        if (error) throw error;

        toast({
          title: "Issue Reported!",
          description: "Thank you for reporting this issue. We'll review it soon.",
        });
        
        // Reset form on success
        setTitle("");
        setDescription("");
        setCategory("");
        setPriority("medium");
        setLocation("");
        setCoordinates(null);
        setPhoto(null);
        setPhotoPreview(null);
        setRetryAttempted(false);
        setPendingFormData(null);
      }
    } catch (error: any) {
      console.error("Error creating issue:", error);
      
      // If backend fails, try fallback to Supabase (only once)
      if (useBackend && !retryAttempted) {
        console.warn("Backend issue creation failed, falling back to Supabase...");
        setUseBackend(false);
        setRetryAttempted(true);
        setPendingFormData(formData);
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to create issue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="report" className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Report an Issue</h2>
          <p className="text-muted-foreground">
            Help improve your community by reporting civic issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>
              Provide details about the civic issue you want to report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="Environment">Environment</SelectItem>
                      <SelectItem value="Safety">Safety</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Public Services">Public Services</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter the location of the issue"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={getCurrentLocation}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                {coordinates && (
                  <p className="text-sm text-muted-foreground">
                    Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed description of the issue"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Photo (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Take a photo or upload from gallery
                    </span>
                  </label>
                  {photoPreview && (
                    <div className="mt-4">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Report Issue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ReportIssueForm;