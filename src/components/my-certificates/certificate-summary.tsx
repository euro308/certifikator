"use client";

import React, { useState } from "react";
import { Copy, Plus, Search, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";

interface CertificateSummaryProps {
  userCertificates: {
    id: string;
    createdAt: Date;
    userId: string;
    templateId: string;
    recipientName: string;
    recipientEmail: string;
    recipientData: unknown;
    certificateUrl: string;
    validationToken: string;
    sentAt: Date | null;
  }[];
}

export function CertificateSummary({
  userCertificates,
}: CertificateSummaryProps) {
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("nameAToZ");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [currentCertificateId, setCurrentCertificateId] = useState<string>("");
  const utils = api.useUtils();
  const deleteCertificateMutation =
    api.certificates.deleteCertificate.useMutation();

  const deleteCertificateFromUser = (certificateId: string) => {
    deleteCertificateMutation.mutate(
      {
        id: certificateId,
      },
      {
        onSuccess: (_data) => {
          setDeleteDialog(false);
          toast.loading("Certifikát se maže...");

          void utils.certificates.getUserCertificates.invalidate().then(() => {
            toast.dismiss();
            toast.success("Certifikát byl úspěšně smazán!");
            setCurrentCertificateId("");
          });
        },
        onError: (err) => {
          console.log(err);
          toast.error("Chyba při mazání certifikátu");
        },
      },
    );
  };

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Zabrání prokliku na detail certifikátu
    await navigator.clipboard.writeText(id);
    toast.success("ID zkopírováno");
  };

  const filteredCertificates = userCertificates
    .filter(
      (certificate) =>
        certificate.recipientName
          .toLowerCase()
          .includes(searchValue.toLowerCase()) ||
        certificate.id.toLowerCase().includes(searchValue.toLowerCase()) ||
        (certificate.recipientEmail.toLowerCase() ?? "").includes(
          searchValue.toLowerCase(),
        ),
    )
    .sort((a, b) => {
      switch (selectedSort) {
        case "nameAToZ":
          return a.recipientName.localeCompare(b.recipientName);
        case "nameZToA":
          return b.recipientName.localeCompare(a.recipientName);
        case "creationDateNewest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "creationDateOldest":
          return (
            new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "emailAToZ":
          return a.recipientEmail.localeCompare(b.recipientEmail);
        case "emailZToA":
          return b.recipientEmail.localeCompare(a.recipientEmail);
        default:
          return 0;
      }
    });

  const sortBy = [
    { label: "Jméno držitele: A až Z", value: "nameAToZ" },
    { label: "Jméno držitele: Z až A", value: "nameZToA" },
    { label: "E-mailová adresa: A až Z", value: "emailAToZ" },
    { label: "E-mailová adresa: Z až A", value: "emailZToA" },
    { label: "Datum vytvoření: nejnovější", value: "creationDateNewest" },
    { label: "Datum vytvoření: nejstarší", value: "creationDateOldest" },
  ];

  return (
    <>
      {userCertificates.length === 0 ? (
        <div className="flex h-[75vh] min-h-full flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <div className="bg-secondary mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <Plus className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            Zatím žádné certifikáty
          </h3>
          <p className="text-muted-foreground mt-2 mb-4 text-sm">
            Zatím jste nevytvořili žádný certifikát. Začněte tím prvním!
          </p>
          <Button asChild>
            <Link href="/dashboard/me-certifikaty/novy">
              Vytvořit certifikát
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex h-[75vh] min-h-full flex-col items-center rounded-lg border border-dashed pt-5 text-center">
          {/* NAVIGACE - SEARCH A SEŘAZENÍ */}
          <div className="mb-6 flex w-full flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
            <InputGroup className="h-12 w-full md:w-[400px] lg:w-[40vw]">
              <InputGroupInput
                type="text"
                value={searchValue}
                placeholder="Vyhledat certifikát"
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
            </InputGroup>

            <div className="flex items-center justify-between gap-2 md:justify-end">
              <span className="text-muted-foreground text-sm">
                Seřadit podle:
              </span>
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {sortBy.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* LIST CERTIFIKÁTŮ (Scrollable container with sticky header) */}
          <div className="flex w-full flex-1 flex-col overflow-hidden px-5 pb-5">
            <div className="flex-1 overflow-y-auto rounded-md border">
              {/* Header - Hidden on Mobile */}
              {/* Desktop grid layout: [Image, Name, Description, Created, Used, ID, Actions] */}
              <div className="bg-background text-muted-foreground sticky top-0 z-10 hidden items-center gap-4 border-b px-5 py-3 text-sm md:grid md:grid-cols-[70px_1fr_100px_80px_40px] lg:grid-cols-[70px_1fr_1.5fr_100px_80px_100px_40px]">
                <div /> {/* Místo pro náhled */}
                <span
                  className={`text-left ${
                    selectedSort === "nameAToZ" || selectedSort === "nameZToA"
                      ? "text-foreground font-bold"
                      : ""
                  }`}
                >
                  Jméno držitele
                </span>
                <span
                  className={`text-left ${
                    selectedSort === "emailAToZ" || selectedSort === "emailZToA"
                      ? "text-foreground font-bold"
                      : ""
                  }`}
                >
                  E-mailová adresa držitele
                </span>
                <span
                  className={`text-left ${
                    selectedSort === "creationDateNewest" ||
                    selectedSort === "creationDateOldest"
                      ? "text-foreground font-bold"
                      : ""
                  }`}
                >
                  Vytvořeno
                </span>
                <span className="hidden text-left lg:block">ID šablony</span>
                <span className="hidden text-left lg:block">
                  ID certifikátu
                </span>
                <div /> {/* Místo pro akce */}
              </div>

              {/* Rows */}
              <div className="flex flex-col">
                {filteredCertificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="hover:bg-muted/30 grid grid-cols-[70px_1fr_40px] items-center gap-4 border-b px-5 py-2 text-left transition-colors last:border-0 md:grid-cols-[70px_1fr_100px_80px_40px] lg:grid-cols-[70px_1fr_1.5fr_100px_80px_100px_40px]"
                  >
                    {/* 1. Preview Image */}
                    <div className="bg-muted relative aspect-[1.414/1] w-[70px] flex-shrink-0 overflow-hidden rounded border shadow-sm">
                      {certificate.certificateUrl ? (
                        <div />
                      ) : (
                        /*
                        <Image
                          alt={certificate.recipientName}
                          src={certificate.certificateUrl}
                          className="object-cover"
                          fill
                          sizes="70px"
                        />
                         */
                        <div className="text-muted-foreground flex h-full cursor-default items-center justify-center p-1 text-center text-[10px] leading-tight uppercase">
                          Bez náhledu
                        </div>
                      )}
                    </div>

                    {/* 2. Name (All) + Mobile Meta */}
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <Link
                        href={`/dashboard/me-certifikaty/${certificate.id}`}
                      >
                        <span className={"cursor-pointer truncate"}>
                          {certificate.recipientName}
                        </span>
                      </Link>

                      {/* Mobile Meta Info */}
                      <div className="text-muted-foreground flex flex-col gap-0.5 text-xs md:hidden">
                        <span>
                          {new Date(certificate.createdAt).toLocaleDateString(
                            "cs-CZ",
                          )}
                        </span>
                      </div>
                    </div>

                    {/* 3. E-mail (MD+) */}
                    <span className={"text-left"}>
                      {certificate.recipientEmail}
                    </span>

                    {/* 4. Date (MD+) */}
                    <span className={"hidden text-sm md:block"}>
                      {new Date(certificate.createdAt).toLocaleDateString(
                        "cs-CZ",
                      )}
                    </span>

                    {/* 5. template ID (LG only) - Moved to end with Copy Button */}
                    <div className="group hidden items-center gap-2 lg:flex">
                      {certificate.templateId && (
                        <>
                          <span
                            className="text-muted-foreground truncate font-mono text-[10px] select-none"
                            title={certificate.templateId}
                          >
                            {certificate.templateId.substring(0, 8)}...
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) =>
                              handleCopyId(certificate.templateId, e)
                            }
                            title="Zkopírovat ID"
                          >
                            <Copy className="size-3" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* 6. certificate ID (LG only) - Moved to end with Copy Button */}
                    <div className="group hidden items-center gap-2 lg:flex">
                      <span
                        className="text-muted-foreground truncate font-mono text-[10px] select-none"
                        title={certificate.id}
                      >
                        {certificate.id.substring(0, 8)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => handleCopyId(certificate.id, e)}
                        title="Zkopírovat ID"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>

                    {/* 7. Delete Button */}
                    <div
                      className="flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setDeleteDialog(true);
                          setCurrentCertificateId(certificate.id);
                        }
                        }
                      >
                        <Trash className="size-4" color="#e7000b"/>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteDialog
        type={"certificate"}
        open={deleteDialog}
        onOpenChange={() => setDeleteDialog(!deleteDialog)}
        onConfirm={() => deleteCertificateFromUser(currentCertificateId)}
        onCancel={() => setCurrentCertificateId("")}
        isDeleting={deleteCertificateMutation.isPending}
      />
    </>
  );
}
