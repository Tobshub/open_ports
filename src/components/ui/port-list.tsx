import { useEffect, useState } from "react";
import { portScan } from "@/node/node-api";

export type NetstatData = [string, string, string, string, string, string, string];

export function PortListComponent() {
  const portScanner = useNetstat(portScan);
  const [filterIndex, setFilterIndex] = useState(3);

  useEffect(() => {
    const refresh = setInterval(() => {
      portScanner.refresh();
    }, 3000);
    return () => {
      clearInterval(refresh);
    };
  }, []);

  const [filter, setFilter] = useState("");

  return (
    <div>
      <h1>PORTS</h1>
      <div>
        <label>
          <span>Filter by</span>{" "}
          <select onChange={(e) => setFilterIndex(parseInt(e.target.value))} defaultValue={3}>
            <option value={0}>Protocol</option>
            <option value={1}>Received Queue</option>
            <option value={2}>Sent Queue</option>
            <option value={3}>Local Address</option>
            <option value={4}>Foreign Address</option>
            <option value={5}>State</option>
            <option value={6}>PID/Program Name</option>
          </select>{" "}
          : <input placeholder="filter query" type="text" onChange={(e) => setFilter(e.target.value)} value={filter} />
        </label>
      </div>
      <table
        style={{
          textAlign: "left",
          borderSpacing: ".75rem",
        }}
        className="port-list-table"
      >
        <thead>
          <tr>
            <td>Protocol</td>
            <td>Received Queue</td>
            <td>Sent Queue</td>
            <td>Local Address</td>
            <td>Foreign Address</td>
            <td>State</td>
            <td>PID/Program Name</td>
          </tr>
        </thead>
        <tbody>
          {portScanner.data
            .filter((data) => (filter ? data[filterIndex]?.toLowerCase().includes(filter.toLowerCase()) : true))
            .map((portData, index) => (
              <PortData
                data={portData}
                key={portData[3] + portData[4] + portData[6] + index}
                killSelf={() => portScanner.killPort(parseInt(portData[6]))}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}

function PortData({ data, killSelf }: { data: NetstatData; killSelf: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <tr style={{ marginBottom: ".5rem" }} className="port-data-container">
      {data.slice(0, 7).map((data, index) => (
        <td
          key={data + index}
          style={{
            fontWeight: index === 3 || index === 6 ? 700 : 400,
          }}
        >
          {data}
        </td>
      ))}
      <td>
        {data[6] !== "-" ? (
          <button onClick={() => setIsModalOpen((state) => !state)} className="kill-button">
            KILL
          </button>
        ) : null}
      </td>
      <td>
        {isModalOpen ? (
          <ConfirmKillModal portData={data} close={() => setIsModalOpen(false)} confirm={killSelf} />
        ) : null}
      </td>
    </tr>
  );
}

function ConfirmKillModal({
  portData,
  close,
  confirm,
}: {
  portData: NetstatData;
  close: () => void;
  confirm: () => void;
}) {
  return (
    <div className="overlay-modal">
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <h2>Are you sure?</h2>
        <p>
          You are about to kill <strong>{portData[6]}</strong>
        </p>
        <small className="danger">Warning: This is action is not recommended and may have unexpected results.</small>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="danger" onClick={confirm}>
            CONFIRM
          </button>
          <button onClick={close}>CANCEL</button>
        </div>
      </form>
    </div>
  );
}

function useNetstat(scanner: typeof portScan) {
  const [data, setData] = useState<NetstatData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setData(formatNetstatData(scanner.scan()));
    } catch (err) {
      setError(err as string);
    }
  }, []);

  const refresh = () => {
    setData(formatNetstatData(scanner.scan()));
  };

  return {
    data,
    error,
    refresh,
    killPort: (processID: number) => scanner.kill(processID.toString()),
  };
}

function formatNetstatData(data: Buffer | null) {
  if (!data) return [];
  return BufStringify(data)
    ?.split("\n")
    .map((line) => line.split(" ").filter((text) => text !== ""))
    .slice(2, -1)
    .sort((a, b) => (a[6] === "-" ? (b[6] === "-" ? 0 : 1) : b[6] !== "-" ? 0 : -1)) as NetstatData[];
}

function BufStringify(data: any): string {
  return Buffer.from(data).toString("utf8");
}

