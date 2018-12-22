import { distanceInWordsStrict, format } from "date-fns";

type Timespan = {
  id: string;
  links: string[];
  start: number;
  end: number;
  payload?: {
    [key: string]: {
      $set?: any;
    };
  };
};

export function createTimeline() {
  const items: Timespan[] = [];
  function count() {
    return items.length;
  }

  function getLatestItem(): Timespan | undefined {
    return items[count() - 1];
  }

  function isItemOpen(item: Timespan) {
    return item.end === 0;
  }

  function isItemClose(item: Timespan) {
    return item.start <= item.end;
  }

  function isNowOpen() {
    const item = getLatestItem();
    return item && isItemOpen(item);
  }

  function stop() {
    const item = getLatestItem();
    if (item && isItemOpen(item)) {
      item.end = Date.now();
    }
  }

  function start() {
    const item = getLatestItem();
    if (item && isItemOpen(item)) {
      item.end = Date.now();
    }
    const span: Timespan = {
      id: `${count()}`,
      links: [],
      start: Date.now(),
      end: 0
    };
    items.push(span);
  }

  function link(id: string) {
    const item = getLatestItem();
    if (item && isItemOpen(item)) {
      if (item.links.includes(id)) {
        return;
      }
      item.links.push(id);
    } else {
      console.error("The timeline is closed.");
    }
  }

  function log(n: number = 10) {
    const theFormat = "YYYY-MM-D hh:mm:ss";
    const firstIdx = Math.max(0, count() - n);
    for (let i = firstIdx; i < count(); i++) {
      const item = items[i];
      console.log(
        `#${item.id}`.padEnd(8, " "),
        `${format(item.start, theFormat)} - ${format(
          item.end || Date.now(),
          theFormat
        )}`,
        distanceInWordsStrict(item.start, item.end || Date.now()),
        item.links.length > 0 ? `(links to ${item.links.join(", ")})` : ""
      );
    }
  }

  function play() {
    const ret: any = {};
    items.forEach(item => {
      const result: any = {};
      item.links.forEach(linkId => {
        Object.assign(result, ret[linkId]);
      });
      if (item.payload) {
        Object.entries(item.payload).forEach(([key, value]) => {
          if (value.$set !== undefined) {
            result[key] = value.$set;
          }
        });
      }
      ret[item.id] = result;
    });
    return ret;
  }

  function countTotalTime() {
    return items.reduce(
      (acc, item) => acc + (item.end || Date.now()) - item.start,
      0
    );
  }

  function exportAsString() {
    return JSON.stringify(items, null, 2);
  }

  function importFromString(str: string) {
    items.push(...JSON.parse(str));
  }

  function setPayload(key: string, value: any) {
    const item = getLatestItem();
    if (item && isItemOpen(item)) {
      const payload = item.payload || {};
      if (!payload[key]) {
        payload[key] = {};
      }
      payload[key].$set = value;
      item.payload = payload;
    } else {
      console.error("closed");
    }
  }

  return {
    count,
    start,
    link,
    log,
    exportAsString,
    importFromString,
    stop,
    countTotalTime,
    setPayload,
    play
  };
}
