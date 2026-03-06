"use client";

import React from "react";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KeyRound,
  Search,
  Loader2,
  Copy,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/dialogs/delete-dialog";
import { useDebounce } from "@/hooks/use-debounce";

export function UsersTab() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFetching,
  } = api.admin.getUsers.useInfiniteQuery(
    {
      limit: 20,
      search: debouncedSearchQuery || undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const users = data?.pages.flatMap((page) => page.items) ?? [];
  const loadMoreRef = React.useRef<HTMLTableRowElement>(null);

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "400px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const utils = api.useUtils();
  const [resettingUserId, setResettingUserId] = React.useState<string | null>(
    null,
  );
  const [userToDelete, setUserToDelete] = React.useState<string | null>(null);
  const [userToReset, setUserToReset] = React.useState<{
    id: string;
    email: string;
  } | null>(null);

  const resetPasswordMutation = api.emails.sendPasswordReset.useMutation({
    onMutate: () => {
      // UI state handled separately
    },
    onSuccess: () => {
      toast.success(
        "Odkaz na obnovu hesla byl úspěšně odeslán uživateli na e-mail.",
      );
    },
    onError: () => {
      toast.error("Nepodařilo se odeslat odkaz.");
    },
    onSettled: () => {
      setResettingUserId(null);
    },
  });

  const handleResetPassword = (userId: string, email: string) => {
    setUserToReset({ id: userId, email });
  };

  const confirmResetPassword = () => {
    if (!userToReset) return;
    setResettingUserId(userToReset.id);
    resetPasswordMutation.mutate({ emailAddress: userToReset.email });
    setUserToReset(null);
  };

  const deleteUserMutation = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Uživatel byl trvale smazán ze systému.");
      void utils.admin.getUsers.invalidate();
      void utils.admin.getOverviewStats.invalidate();
      setUserToDelete(null);
    },
    onError: () => {
      toast.error("Nepodařilo se smazat uživatele.");
    },
  });

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate({ userId: userToDelete });
    }
  };

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID uživatele zkopírováno");
    } catch {
      toast.error("Nepodařilo se zkopírovat ID");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-md border p-6">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
          <p className="text-muted-foreground">Načítám uživatele systému...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative flex max-w-sm items-center gap-2">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="hledat dle ID, jména nebo e-mailu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={isFetching}
        />
      </div>

      <div className="bg-card relative rounded-md border [&>div]:max-h-[600px] [&>div]:overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                ID uživatele
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Jméno
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Email
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Zaregistrován
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 text-right shadow-sm">
                Šablony
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 text-right shadow-sm">
                Certifikáty
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 text-right shadow-sm">
                Akce
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="group flex items-center gap-2">
                    <span
                      className="text-muted-foreground font-mono text-xs select-none"
                      title={user.id}
                    >
                      {user.id.substring(0, 8)}...
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => handleCopyId(user.id, e)}
                      title="Zkopírovat ID"
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), "dd. MM. yyyy", {
                    locale: cs,
                  })}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {user.templatesCount}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {user.certificatesCount}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="bottom"
                      align="end"
                      className="w-56"
                    >
                      <DropdownMenuItem
                        className="flex cursor-pointer gap-2 focus:bg-indigo-50"
                        disabled={resettingUserId === user.id}
                        onClick={() => handleResetPassword(user.id, user.email)}
                      >
                        {resettingUserId === user.id ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <KeyRound className="size-4" />
                        )}
                        <span>Reset hesla emailem</span>
                      </DropdownMenuItem>

                      {user.id !== process.env.NEXT_PUBLIC_OFFICIAL_USER_ID && (
                        <DropdownMenuItem
                          className="flex cursor-pointer gap-2 font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
                          disabled={deleteUserMutation.isPending}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash className="size-4 text-red-600" />
                          <span>Smazat uživatele</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Žádní uživatelé nenalezeni.
                </TableCell>
              </TableRow>
            )}
            {(hasNextPage || isFetchingNextPage) && (
              <TableRow ref={loadMoreRef}>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="text-muted-foreground mx-auto flex w-fit items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Načítám další uživatele...
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteDialog
        type="user"
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onCancel={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        isDeleting={deleteUserMutation.isPending}
      />

      <AlertDialog
        open={!!userToReset}
        onOpenChange={(open) => !open && setUserToReset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odeslat odkaz pro obnovu hesla?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete uživateli s emailem{" "}
              <strong>{userToReset?.email}</strong> odeslat e-mail s odkazem pro
              vyresetování a nastavení nového hesla?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToReset(null)}>
              Zrušit
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>
              Odeslat e-mail
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
