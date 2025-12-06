import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Building2,
  Receipt,
  Award,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

interface InstituteSetting {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logo_url: string;
}

interface ReceiptSetting {
  prefix: string;
  footer_text: string;
  show_signature: boolean;
}

interface CertificateSetting {
  prefix: string;
  template: string;
  show_logo: boolean;
  show_signature: boolean;
  signatory_name: string;
  signatory_title: string;
}

export default function Settings() {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [instituteSettings, setInstituteSettings] = useState<InstituteSetting>({
    name: 'Ganishka Technology',
    tagline: 'Tech Coaching Institute',
    email: '',
    phone: '',
    address: '',
    website: '',
    logo_url: '',
  });

  const [receiptSettings, setReceiptSettings] = useState<ReceiptSetting>({
    prefix: 'RCP',
    footer_text: 'Thank you for your payment!',
    show_signature: true,
  });

  const [certificateSettings, setCertificateSettings] = useState<CertificateSetting>({
    prefix: 'CERT',
    template: 'default',
    show_logo: true,
    show_signature: true,
    signatory_name: '',
    signatory_title: 'Director',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('setting_key, setting_value')
        .is('branch_id', null);

      if (error) throw error;

      (data || []).forEach((setting) => {
        const value = setting.setting_value as any;
        switch (setting.setting_key) {
          case 'institute':
            setInstituteSettings(prev => ({ ...prev, ...value }));
            break;
          case 'receipt':
            setReceiptSettings(prev => ({ ...prev, ...value }));
            break;
          case 'certificate':
            setCertificateSettings(prev => ({ ...prev, ...value }));
            break;
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setIsSaving(true);
    try {
      // Try to update first
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('setting_key', key)
        .is('branch_id', null)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ setting_value: value })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({ setting_key: key, setting_value: value, branch_id: null });

        if (error) throw error;
      }

      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header title="Settings" subtitle="System configuration" />
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <SettingsIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Access Restricted</h3>
              <p className="text-muted-foreground">Only administrators can access system settings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Settings" subtitle="System configuration" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="System configuration" />

      <div className="p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="institute" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="institute" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Institute
            </TabsTrigger>
            <TabsTrigger value="receipt" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Receipts
            </TabsTrigger>
            <TabsTrigger value="certificate" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificates
            </TabsTrigger>
          </TabsList>

          {/* Institute Settings */}
          <TabsContent value="institute">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Institute Information</CardTitle>
                <CardDescription>General settings for your institute</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Institute Name</Label>
                    <Input
                      value={instituteSettings.name}
                      onChange={(e) => setInstituteSettings({ ...instituteSettings, name: e.target.value })}
                      placeholder="Ganishka Technology"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input
                      value={instituteSettings.tagline}
                      onChange={(e) => setInstituteSettings({ ...instituteSettings, tagline: e.target.value })}
                      placeholder="Tech Coaching Institute"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={instituteSettings.email}
                      onChange={(e) => setInstituteSettings({ ...instituteSettings, email: e.target.value })}
                      placeholder="info@ganishka.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      value={instituteSettings.phone}
                      onChange={(e) => setInstituteSettings({ ...instituteSettings, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={instituteSettings.website}
                    onChange={(e) => setInstituteSettings({ ...instituteSettings, website: e.target.value })}
                    placeholder="https://ganishka.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Textarea
                    value={instituteSettings.address}
                    onChange={(e) => setInstituteSettings({ ...instituteSettings, address: e.target.value })}
                    placeholder="Full address..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => saveSetting('institute', instituteSettings)}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Institute Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt Settings */}
          <TabsContent value="receipt">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Receipt Settings</CardTitle>
                <CardDescription>Configure receipt generation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Receipt Number Prefix</Label>
                  <Input
                    value={receiptSettings.prefix}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, prefix: e.target.value })}
                    placeholder="RCP"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Preview: {receiptSettings.prefix}-202412-00001
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Footer Text</Label>
                  <Textarea
                    value={receiptSettings.footer_text}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, footer_text: e.target.value })}
                    placeholder="Thank you for your payment!"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Show Signature Line</Label>
                    <p className="text-sm text-muted-foreground">Include signature line on receipts</p>
                  </div>
                  <Switch
                    checked={receiptSettings.show_signature}
                    onCheckedChange={(checked) => setReceiptSettings({ ...receiptSettings, show_signature: checked })}
                  />
                </div>

                <Button
                  onClick={() => saveSetting('receipt', receiptSettings)}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Receipt Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificate Settings */}
          <TabsContent value="certificate">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Certificate Settings</CardTitle>
                <CardDescription>Configure certificate generation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Certificate Number Prefix</Label>
                  <Input
                    value={certificateSettings.prefix}
                    onChange={(e) => setCertificateSettings({ ...certificateSettings, prefix: e.target.value })}
                    placeholder="CERT"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Preview: {certificateSettings.prefix}-2024-00001
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Signatory Name</Label>
                    <Input
                      value={certificateSettings.signatory_name}
                      onChange={(e) => setCertificateSettings({ ...certificateSettings, signatory_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Signatory Title</Label>
                    <Input
                      value={certificateSettings.signatory_title}
                      onChange={(e) => setCertificateSettings({ ...certificateSettings, signatory_title: e.target.value })}
                      placeholder="Director"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Show Logo</Label>
                      <p className="text-sm text-muted-foreground">Include institute logo on certificates</p>
                    </div>
                    <Switch
                      checked={certificateSettings.show_logo}
                      onCheckedChange={(checked) => setCertificateSettings({ ...certificateSettings, show_logo: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Show Signature</Label>
                      <p className="text-sm text-muted-foreground">Include signature line on certificates</p>
                    </div>
                    <Switch
                      checked={certificateSettings.show_signature}
                      onCheckedChange={(checked) => setCertificateSettings({ ...certificateSettings, show_signature: checked })}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => saveSetting('certificate', certificateSettings)}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Certificate Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
