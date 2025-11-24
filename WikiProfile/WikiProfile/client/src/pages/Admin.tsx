import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WikiEntry, User } from "@shared/schema";
import { Loader2, CheckCircle, XCircle, ImageOff, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { EntryDetailDialog } from "@/components/EntryDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Textarea,
} from "@/components/ui/textarea";

type EntryWithUser = WikiEntry & { user: User };

export default function Admin() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedEntry, setSelectedEntry] = useState<EntryWithUser | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete" | null>(null);
  const [entryToAction, setEntryToAction] = useState<EntryWithUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: entries, isLoading: entriesLoading } = useQuery<EntryWithUser[]>({
    queryKey: ["/api/admin/entries"],
  });

  useEffect(() => {
    if (!authLoading && currentUser && !currentUser.isAdmin) {
      toast({
        title: "Không được phép",
        description: "Bạn không có quyền truy cập trang này",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [authLoading, currentUser, toast]);

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/admin/entries/${id}/moderate`, { status, reason: rejectReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/entries"] });
      setActionDialogOpen(false);
      setEntryToAction(null);
      setActionType(null);
      setRejectReason("");
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái entry",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Không được phép",
          description: "Đang đăng nhập lại...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/entries/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/entries"] });
      setActionDialogOpen(false);
      setEntryToAction(null);
      setActionType(null);
      toast({
        title: "Thành công",
        description: "Đã xóa entry",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Không được phép",
          description: "Đang đăng nhập lại...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Lỗi",
        description: "Không thể xóa entry",
        variant: "destructive",
      });
    },
  });

  const handleAction = (entry: EntryWithUser, type: "approve" | "reject" | "delete") => {
    setEntryToAction(entry);
    setActionType(type);
    setRejectReason("");
    setActionDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!entryToAction || !actionType) return;

    if (actionType === "delete") {
      deleteMutation.mutate(entryToAction.id);
    } else {
      const status = actionType === "approve" ? "approved" : "rejected";
      moderateMutation.mutate({ id: entryToAction.id, status });
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

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

  const truncateText = (text: string, length: number = 100) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return null;
  }

  const filteredEntries = entries?.filter((entry) => {
    if (selectedTab === "all") return true;
    return entry.status === selectedTab;
  }) || [];

  const pendingCount = entries?.filter((e) => e.status === "pending").length || 0;
  const approvedCount = entries?.filter((e) => e.status === "approved").length || 0;
  const rejectedCount = entries?.filter((e) => e.status === "rejected").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" data-testid="text-admin-title">
              Kiểm duyệt nội dung
            </h1>
            <p className="text-muted-foreground" data-testid="text-admin-description">
              Quản lý và kiểm duyệt các entries từ người dùng
            </p>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList data-testid="tabs-filter">
              <TabsTrigger value="all" data-testid="tab-all">
                Tất cả ({entries?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Chờ duyệt ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">
                Đã duyệt ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Đã từ chối ({rejectedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-4">
              {entriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-card">
                  <p className="text-lg text-muted-foreground" data-testid="text-no-entries">
                    Không có entry nào
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      data-testid={`card-entry-${entry.id}`}
                      className="border rounded-lg p-4 bg-card hover-elevate transition-all"
                    >
                      <div className="flex gap-4 items-stretch">
                        {/* Image on left */}
                        <div className="h-32 w-32 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {entry.imageUrl ? (
                            <img
                              src={entry.imageUrl}
                              alt={entry.title}
                              className="h-full w-full object-cover"
                              data-testid={`img-entry-${entry.id}`}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Content in middle */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="space-y-2">
                            {/* Username and avatar */}
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={entry.user.profileImageUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(entry.user.firstName, entry.user.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm" data-testid={`text-author-${entry.id}`}>
                                  {`${entry.user.firstName || ""} ${entry.user.lastName || ""}`.trim() || "Người dùng"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(entry.createdAt!), { addSuffix: true, locale: vi })}
                                </p>
                              </div>
                            </div>

                            {/* Title */}
                            <p className="font-semibold line-clamp-1" data-testid={`text-title-${entry.id}`}>
                              {entry.title}
                            </p>

                            {/* Truncated content */}
                            <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-content-${entry.id}`}>
                              {truncateText(entry.description, 120)}
                            </p>
                          </div>

                          {/* Status badge at bottom left */}
                          <Badge variant={getStatusVariant(entry.status)} className="w-fit" data-testid={`badge-status-${entry.id}`}>
                            {getStatusText(entry.status)}
                          </Badge>
                        </div>

                        {/* Action buttons on right */}
                        <div className="flex flex-col gap-2 justify-between items-end">
                          <div className="flex gap-2 flex-wrap justify-end">
                            {entry.status !== "approved" && (
                              <Button
                                size="sm"
                                onClick={() => handleAction(entry, "approve")}
                                data-testid={`button-approve-${entry.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Duyệt
                              </Button>
                            )}
                            {entry.status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(entry, "reject")}
                                data-testid={`button-reject-${entry.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Từ chối
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setDetailDialogOpen(true);
                            }}
                            data-testid={`button-view-${entry.id}`}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Entry Detail Dialog */}
      <EntryDetailDialog
        entry={selectedEntry}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        canEdit={false}
      />

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent data-testid="dialog-action-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" && "Phê duyệt entry"}
              {actionType === "reject" && "Từ chối entry"}
              {actionType === "delete" && "Xóa entry"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve" && `Bạn có chắc chắn muốn phê duyệt entry "${entryToAction?.title}"?`}
              {actionType === "reject" && `Bạn có chắc chắn muốn từ chối entry "${entryToAction?.title}"?`}
              {actionType === "delete" && `Bạn có chắc chắn muốn xóa entry "${entryToAction?.title}"? Hành động này không thể hoàn tác.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionType === "reject" && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Lý do từ chối:</label>
              <Textarea
                placeholder="Nhập lý do từ chối (tùy chọn)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                data-testid="input-reject-reason"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-action">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={actionType === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              data-testid="button-confirm-action"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
