import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ReactComponent as CloseSvg } from "../../assets/close.svg";
import * as S from "./list.route.style";
import { statsRoutePaths } from "../../route.paths";
import { appRoutePaths } from "../../../App/route.paths";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAllStats } from "../../api/api";
import { useInView } from "react-intersection-observer";

const STATS_PER_PAGE = 25;

export const StatsRoute = () => {
  const navigate = useNavigate();

  const parentRef = React.useRef<HTMLDivElement>(null);

  const goHome = () => {
    navigate(appRoutePaths.home);
  };

  const fetchStats = async ({ pageParam = 0 }) => {
    return getAllStats({
      offset: pageParam * STATS_PER_PAGE,
      limit: STATS_PER_PAGE,
    });
  };

  const { ref, inView } = useInView();

  const {
    data: stats,
    hasNextPage,
    fetchNextPage,
    isLoading,
  } = useInfiniteQuery(["infinite-stats"], fetchStats, {
    getNextPageParam: (lastPage, pages) => {
      if (pages.length * STATS_PER_PAGE >= lastPage.meta.total) {
        return undefined;
      }
      return pages.length;
    },
  });

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const items = (stats?.pages || []).map((page) => page.records).flat();

  const rowVirtualizer = useVirtualizer({
    count: items.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 25,
    overscan: 5,
  });

  if (isLoading) {
    return <div>загрузка...</div>;
  }

  if (!stats) {
    return <div>Не удалось загрузить данные</div>;
  }

  return (
    <div>
      <S.CloseSvgContainer onClick={goHome}>
        <CloseSvg />
      </S.CloseSvgContainer>
      <S.Title>Статистика</S.Title>

      {items.length === 0 ? (
        "Нет данных"
      ) : (
        <>
          <S.ListContainer ref={parentRef}>
            <S.List
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <S.Row
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  key={virtualRow.index}
                >
                  <S.ID>#{items[virtualRow.index].id}</S.ID>
                  <S.Date>
                    {format(
                      new Date(+items[virtualRow.index].start_time),
                      "dd/MM/yyyy hh:mm:ss"
                    )}
                  </S.Date>
                  <S.Action>
                    <Link
                      to={statsRoutePaths.detail.replace(
                        ":id",
                        String(items[virtualRow.index].id)
                      )}
                    >
                      View
                    </Link>
                  </S.Action>
                </S.Row>
              ))}
            </S.List>
          </S.ListContainer>
          <div ref={ref}>{hasNextPage && "грузим..."}</div>
        </>
      )}
    </div>
  );
};

export const Component = StatsRoute;

Object.assign(Component, {
  displayName: "LazyStatsRoute",
});
