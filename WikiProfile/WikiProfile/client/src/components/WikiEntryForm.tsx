import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WikiEntry } from "@shared/schema";
import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(255, "Tiêu đề tối đa 255 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
  imageUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface WikiEntryFormProps {
  entry?: WikiEntry;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function WikiEntryForm({ entry, onSubmit, onCancel, isSubmitting }: WikiEntryFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(entry?.imageUrl || null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: entry?.title || "",
      description: entry?.description || "",
      imageUrl: entry?.imageUrl || "",
    },
  });

  const handleImageUrlChange = (url: string) => {
    form.setValue("imageUrl", url);
    setImagePreview(url || null);
  };

  const clearImage = () => {
    form.setValue("imageUrl", "");
    setImagePreview(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nhập tiêu đề cho entry..." 
                  {...field} 
                  data-testid="input-entry-title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL hình ảnh</FormLabel>
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      data-testid="img-entry-preview"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={clearImage}
                      data-testid="button-clear-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed bg-muted">
                    <div className="text-center space-y-2">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Chưa có hình ảnh</p>
                    </div>
                  </div>
                )}
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleImageUrlChange(e.target.value);
                      }}
                      data-testid="input-image-url"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleImageUrlChange(field.value || "")}
                      data-testid="button-load-image"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Viết mô tả chi tiết cho entry của bạn..."
                  className="min-h-[200px] resize-none font-serif"
                  {...field}
                  data-testid="textarea-entry-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="button-cancel-entry"
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting} data-testid="button-submit-entry">
            {isSubmitting ? "Đang lưu..." : entry ? "Cập nhật" : "Tạo entry"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
