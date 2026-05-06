"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ActivityList } from "@/components/ActivityList";

const TYPE_FILTERS = [
  { value: "",                label: "All actions"       },
  { value: "INSERT",          label: "Insert"            },
  { value: "UPDATE",          label: "Update"            },
  { value: "DELETE",          label: "Delete"            },
  { value: "REGISTER",        label: "Register"          },
  { value: "ASSIGN_TASK",     label: "Task assigned"     },
  { value: "UPDATE_TASK",     label: "Task updated"      },
  { value: "CREATE_MENTEE",   label: "Mentee created"    },
];

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function ActivityFeedPage() {
  const [actionType, setActionType] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const q = useInfiniteQuery({
    queryKey: ["activity-feed-full", actionType, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/mentor/activity-feed", {
        params: {
          page:        pageParam,
          limit:       20,
          action_type: actionType || undefined,
          search:      debouncedSearch.trim() || undefined,
        },
      });
      return data as {
        data: any[]; page: number; limit: number; total: number; total_pages: number;
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.total_pages ? last.page + 1 : undefined,
  });

  // IntersectionObserver to drive infinite scroll.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && q.hasNextPage && !q.isFetchingNextPage) {
        q.fetchNextPage();
      }
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage]);

  const items = (q.data?.pages ?? []).flatMap((p) => p.data);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Activity feed</h1>
          <p className="text-sm text-ink-500">
            All recent actions by your mentees.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
            <Input
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Select value={actionType} onChange={setActionType} options={TYPE_FILTERS} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {q.data ? `${q.data.pages[0]?.total ?? 0} events` : "Loading…"}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {q.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ActivityList items={items} />
          )}

          {q.hasNextPage && (
            <div ref={sentinelRef} className="py-4 text-center">
              <Button
                variant="ghost"
                loading={q.isFetchingNextPage}
                onClick={() => q.fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
