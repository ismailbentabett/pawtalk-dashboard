import {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DocumentData,
  Query,
  QueryDocumentSnapshot,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  writeBatch
} from "firebase/firestore";
import {
  Download,
  Filter,
  Loader2,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { INITIAL_FILTERS, PETS_PER_PAGE } from "../constants/petManagement";
import { Pet, PetFilters } from "../types/Pet";
import { columns } from "./PetColumns";

export function PetManagement() {
  // State Management
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<PetFilters>(INITIAL_FILTERS);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  // Memoized Derived State
  const selectedCount = useMemo(() => selectedPets.size, [selectedPets]);
  const hasSelection = selectedCount > 0;

  // Firebase Query Builder
  const buildQuery = useCallback(
    (searchTerm = "", filterState = filters): Query<DocumentData> => {
      const baseQuery = collection(db, "pets");
      const constraints = [];

      // Add search constraint
      if (searchTerm) {
        constraints.push(
          where("nameSearchTokens", "array-contains", searchTerm.toLowerCase())
        );
      }

      // Add filter constraints
      if (filterState.species.length) {
        constraints.push(where("species", "in", filterState.species));
      }
      if (filterState.status.length) {
        constraints.push(where("status", "in", filterState.status));
      }
      if (filterState.matchRateThreshold > 0) {
        constraints.push(
          where("matchRateNumeric", ">=", filterState.matchRateThreshold)
        );
      }
      if (filterState.tags.length) {
        constraints.push(where("tags", "array-contains-any", filterState.tags));
      }

      // Add sorting
      constraints.push(orderBy("name"));
      constraints.push(limit(PETS_PER_PAGE));

      return query(baseQuery, ...constraints);
    },
    [filters]
  );

  // Data Fetching
  const fetchPets = useCallback(
    async (searchTerm = "") => {
      try {
        setLoading(true);
        setError(null);

        const petsQuery = buildQuery(searchTerm);
        const snapshot = await getDocs(petsQuery);

        if (snapshot.empty) {
          setPets([]);
          setHasMore(false);
          return;
        }

        const fetchedPets = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
            } as Pet)
        );

        setPets(fetchedPets);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PETS_PER_PAGE);
      } catch (err) {
        console.error("Error fetching pets:", err);
        setError("Failed to load pets. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load pets. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  const loadMorePets = useCallback(async () => {
    if (!lastDoc || !hasMore) return;

    try {
      setLoading(true);

      const baseQuery = buildQuery("");
      const petsQuery = query(baseQuery, startAfter(lastDoc));

      const snapshot = await getDocs(petsQuery);

      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const morePets = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          } as Pet)
      );

      setPets((prev) => [...prev, ...morePets]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PETS_PER_PAGE);
    } catch (err) {
      console.error("Error loading more pets:", err);
      toast({
        title: "Error",
        description: "Failed to load more pets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [lastDoc, hasMore, buildQuery]);

  // Search Handler with Debounce
  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setIsSearching(true);

      const timeoutId = setTimeout(() => {
        fetchPets(value);
        setIsSearching(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    },
    [fetchPets]
  );

  // Batch Operations
  const handleBatchDelete = async () => {
    if (!selectedPets.size) return;

    try {
      setIsBatchUpdating(true);
      const batch = writeBatch(db);

      selectedPets.forEach((id) => {
        const petRef = doc(db, "pets", id);
        batch.delete(petRef);
      });

      await batch.commit();

      toast({
        title: "Success",
        description: `Deleted ${selectedPets.size} pets successfully.`,
        variant: "default",
      });

      setSelectedPets(new Set());
      fetchPets();
    } catch (err) {
      console.error("Error deleting pets:", err);
      toast({
        title: "Error",
        description: "Failed to delete pets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBatchUpdating(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleBatchStatusUpdate = async (status: "Active" | "Inactive") => {
    if (!selectedPets.size) return;

    try {
      setIsBatchUpdating(true);
      const batch = writeBatch(db);

      selectedPets.forEach((id) => {
        const petRef = doc(db, "pets", id);
        batch.update(petRef, {
          status,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      toast({
        title: "Success",
        description: `Updated status for ${selectedPets.size} pets.`,
        variant: "default",
      });

      setSelectedPets(new Set());
      fetchPets();
    } catch (err) {
      console.error("Error updating pets:", err);
      toast({
        title: "Error",
        description: "Failed to update pets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBatchUpdating(false);
    }
  };

  // Export/Import Handlers
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const selectedPetsData = pets.filter((pet) => selectedPets.has(pet.id));
      const data = selectedPets.size ? selectedPetsData : pets;

      const exportData = data.map((pet) => ({
        ...pet,
        createdAt: pet.createdAt?.toISOString(),
        updatedAt: pet.updatedAt?.toISOString(),
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pets-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported ${data.length} pets successfully.`,
        variant: "default",
      });
    } catch (err) {
      console.error("Error exporting pets:", err);
      toast({
        title: "Error",
        description: "Failed to export pets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    try {
      setIsImporting(true);
      const file = event.target.files[0];
      const text = await file.text();
      const importData = JSON.parse(text) as Pet[];

      const batch = writeBatch(db);

      importData.forEach((pet) => {
        const petRef = doc(collection(db, "pets"));
        batch.set(petRef, {
          ...pet,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      toast({
        title: "Success",
        description: `Imported ${importData.length} pets successfully.`,
        variant: "default",
      });

      fetchPets();
    } catch (err) {
      console.error("Error importing pets:", err);
      toast({
        title: "Error",
        description:
          "Failed to import pets. Please check your file format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Single Item Operations
/*   const handleStatusToggle = useCallback(
    async (pet: Pet) => {
      try {
        const newStatus = pet.status === "Active" ? "Inactive" : "Active";
        await updateDoc(doc(db, "pets", pet.id), {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: "Success",
          description: `Updated ${pet.name}'s status to ${newStatus}`,
          variant: "default",
        });

        fetchPets();
      } catch (err) {
        console.error("Error updating pet status:", err);
        toast({
          title: "Error",
          description: "Failed to update pet status. Please try again.",
          variant: "destructive",
        });
      }
    },
    [fetchPets]
  ); */

 /*  const handleDelete = useCallback(
    async (petId: string) => {
      try {
        await deleteDoc(doc(db, "pets", petId));
        toast({
          title: "Success",
          description: "Pet deleted successfully",
          variant: "default",
        });
        fetchPets();
      } catch (err) {
        console.error("Error deleting pet:", err);
        toast({
          title: "Error",
          description: "Failed to delete pet. Please try again.",
          variant: "destructive",
        });
      }
    },
    [fetchPets]
  ); */

  // Effect Hooks
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, [filters, handleSearch, searchQuery]);

  // Table Instance
  const table = useReactTable({
    data: pets,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Main Render
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pet Management</CardTitle>
              <CardDescription>
                Manage and monitor all registered pets
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={handleExport}
                    disabled={isExporting || loading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      document.getElementById("import-file")?.click()
                    }
                    disabled={isImporting || loading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isImporting ? "Importing..." : "Import"}
                    <input
                      id="import-file"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImport}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={!hasSelection || loading}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => fetchPets()}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {showFilters && (
              <Card className="bg-slate-50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Species</label>
                      <Select
                        value={filters.species.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            species: value.split(",").filter(Boolean),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select species" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dog">Dog</SelectItem>
                          <SelectItem value="Cat">Cat</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={filters.status.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: value.split(",").filter(Boolean) as Array<
                              "Active" | "Inactive"
                            >,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Match Rate</label>
                      <Select
                        value={String(filters.matchRateThreshold)}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            matchRateThreshold: Number(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select threshold" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any</SelectItem>
                          <SelectItem value="50">50%+</SelectItem>
                          <SelectItem value="75">75%+</SelectItem>
                          <SelectItem value="90">90%+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tags</label>
                      <Select
                        value={filters.tags.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            tags: value.split(",").filter(Boolean),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tags" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Friendly">Friendly</SelectItem>
                          <SelectItem value="Training Needed">
                            Training Needed
                          </SelectItem>
                          <SelectItem value="Special Care">
                            Special Care
                          </SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters(INITIAL_FILTERS);
                        fetchPets();
                      }}
                    >
                      Reset Filters
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowFilters(false);
                        fetchPets();
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search pets..."
                value={searchQuery}
                onChange={(event) => handleSearch(event.target.value)}
                className="max-w-sm"
              />
              {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
              {selectedCount > 0 && (
                <div className="ml-auto flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchStatusUpdate("Active")}
                    disabled={isBatchUpdating}
                  >
                    Set Active
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchStatusUpdate("Inactive")}
                    disabled={isBatchUpdating}
                  >
                    Set Inactive
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isBatchUpdating}
                  >
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading pets...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && table.getRowModel().rows?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <p className="text-muted-foreground">
                            No pets found
                            {searchQuery && " matching your search criteria"}
                            {Object.values(filters).some((f) =>
                              Array.isArray(f) ? f.length > 0 : f !== 0
                            ) && " with current filters"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setFilters(INITIAL_FILTERS);
                              fetchPets();
                            }}
                          >
                            Reset all filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="group"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage() || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (table.getCanNextPage()) {
                      table.nextPage();
                    } else if (hasMore) {
                      loadMorePets();
                    }
                  }}
                  disabled={(!table.getCanNextPage() && !hasMore) || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} selected pet(s)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isBatchUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={isBatchUpdating}
            >
              {isBatchUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PetManagement;
