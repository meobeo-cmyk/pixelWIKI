import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WikiEntry } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ImageOff, Pencil, Trash2 } from "lucide-react";

interface EntryDetailDialogProps {
  entry: WikiEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EntryDetailDialog({
  entry,
  open,
  onOpenChange,
  canEdit = false,
  onEdit,
  onDelete,
}: EntryDetailDialogProps) {
  if (!entry) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Đã duyệt";
      case "pending":
        return "Chờ duyệt";
      case "rejected":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-entry-detail" aria-describedby="entry-detail-description">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl" data-testid="text-entry-detail-title">
              {entry.title}
            </DialogTitle>
            <Badge variant={getStatusVariant(entry.status)} data-testid="badge-entry-detail-status">
              {getStatusText(entry.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {entry.imageUrl ? (
            <div className="w-full max-h-96 overflow-hidden rounded-md bg-muted">
              <img
                src={entry.imageUrl}
                alt={entry.title}
                className="w-full h-full object-contain"
                data-testid="img-entry-detail"
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted">
              <ImageOff className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          <div className="space-y-4">
            <div id="entry-detail-description" className="prose prose-sm max-w-none font-serif" data-testid="text-entry-detail-description">
              {entry.description.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <p className="text-sm text-muted-foreground" data-testid="text-entry-detail-time">
              Tạo {formatDistanceToNow(new Date(entry.createdAt!), { addSuffix: true, locale: vi })}
            </p>
          </div>

          {canEdit && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onEdit}
                className="flex-1"
                data-testid="button-edit-entry"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                className="flex-1"
                data-testid="button-delete-entry"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
