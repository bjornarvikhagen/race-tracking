import { useEffect, useState, useRef } from "react";
import "./CheckpointTable.css";
import TrashCanSVG from "../../assets/trashcan.svg";

interface DeviceTableProps {
  onDataUpdate: (newData: any) => void;
  deviceData: DeviceData[];
}

type DeviceData = {
  position: number;
  ID: string;
  isEditingID: boolean;
  tempID: string;
  timeLimit: string;
  isEditingTimeLimit: boolean;
  tempTimeLimit: string;
};

function DeviceTable({ onDataUpdate, deviceData }: DeviceTableProps) {
  const [data, setData] = useState<DeviceData[]>(deviceData);
  const bottomRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    setData(deviceData);
  }, [deviceData]);

  useEffect(() => {
    if (bottomRowRef.current) {
      bottomRowRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [data]); // Dependency array includes data to trigger on data change

  // Function to handle starting editing mode
  const handleEditID = (index: number) => {
    const newData = [...data];
    newData[index].isEditingID = true;
    newData[index].tempID = newData[index].ID; // Store the original ID
    setData(newData);
  };

  const handleEditTimeLimit = (index: number) => {
    const newData = [...data];
    newData[index].isEditingTimeLimit = true;
    newData[index].tempTimeLimit = newData[index].timeLimit; // Store the original timeLimit
    setData(newData);
  };

  // Function to handle finishing editing mode
  const handleFinishEditID = (index: number, newID: string) => {
    const newData = [...data];
    newData[index].ID = newID;
    newData[index].isEditingID = false;
    setData(newData);
    onDataUpdate(newData);
  };

  const handleFinishEditTimeLimit = (index: number, newTimeLimit: string) => {
    const newData = [...data];
    newData[index].timeLimit = newTimeLimit;
    newData[index].isEditingTimeLimit = false;
    setData(newData);
    onDataUpdate(newData);
  };

  // Function to handle canceling editing mode
  const handleCancelEditID = (index: number) => {
    const newData = [...data];
    newData[index].ID = newData[index].tempID; // Restore the original ID
    newData[index].isEditingID = false;
    setData(newData);
  };

  const handleCancelEditTimeLimit = (index: number) => {
    const newData = [...data];
    newData[index].timeLimit = newData[index].tempTimeLimit; // Restore the original timeLimit
    newData[index].isEditingTimeLimit = false;
    setData(newData);
  };

  // Function to handle dragging and rearranging rows
  const handleDragStart = (
    event: React.DragEvent<HTMLTableCellElement>,
    index: number
  ) => {
    event.dataTransfer.setData("index", index.toString());
    event.dataTransfer.setData("ID", data[index].ID);
    event.dataTransfer.setData("timeLimit", data[index].timeLimit);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLTableRowElement>,
    dropIndex: number
  ) => {
    const draggedIndex = parseInt(event.dataTransfer.getData("index"));
    const draggedID = event.dataTransfer.getData("ID");
    const draggedTimeLimit = event.dataTransfer.getData("timeLimit");

    // Swap the IDs of dragged and dropped cells
    const newData = [...data];
    newData[draggedIndex].ID = data[dropIndex].ID;
    newData[dropIndex].ID = draggedID;
    newData[draggedIndex].timeLimit = data[dropIndex].timeLimit;
    newData[dropIndex].timeLimit = draggedTimeLimit;

    // Update positions based on the current order in newData
    newData.forEach((item, index) => {
      item.position = index + 1; // Reset positions based on array index
    });

    setData(newData);
    onDataUpdate(newData);
  };

  // Function to remove a row
  const removeRow = (index: number) => {
    // if only one row left, don't remove it
    if (data.length === 1) return;

    const newData = data.filter((_, i) => i !== index);
    // Update positions for the remaining rows
    const updatedData = newData.map((item, i) => ({
      ...item,
      position: i + 1,
    }));
    setData(updatedData);
    onDataUpdate(updatedData);
  };

  return (
    <div className="App">
      <table className="device-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>DeviceID</th>
            <th>TimeLimit</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              ref={index === data.length - 1 ? bottomRowRef : null}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
            >
              <td>{item.position}</td>
              <td
                className={`editable-cell`}
                onDoubleClick={() => handleEditID(index)}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
              >
                {item.isEditingID ? (
                  <textarea
                    placeholder="Enter DeviceID"
                    value={item.ID}
                    onChange={(e) =>
                      setData(
                        data.map((row, i) =>
                          i === index ? { ...row, ID: e.target.value } : row
                        )
                      )
                    }
                    autoFocus
                    onBlur={() => handleFinishEditID(index, data[index].ID)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") handleCancelEditID(index);
                      if (e.key === "Enter")
                        handleFinishEditID(index, data[index].ID);
                    }}
                  />
                ) : item.ID ? (
                  item.ID
                ) : (
                  <span className="empty-cell">Double click to edit </span>
                )}
              </td>
              <td
                className={`editable-cell`}
                onDoubleClick={() => handleEditTimeLimit(index)}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
              >
                {item.isEditingTimeLimit ? (
                  <textarea
                    placeholder="yyyy-mm-dd hh:mm"
                    value={item.timeLimit}
                    onChange={(e) =>
                      setData(
                        data.map((row, i) =>
                          i === index
                            ? { ...row, timeLimit: e.target.value }
                            : row
                        )
                      )
                    }
                    autoFocus
                    onBlur={() =>
                      handleFinishEditTimeLimit(index, data[index].timeLimit)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Escape") handleCancelEditTimeLimit(index);
                      if (e.key === "Enter")
                        handleFinishEditTimeLimit(index, data[index].timeLimit);
                    }}
                  />
                ) : item.timeLimit ? (
                  item.timeLimit
                ) : (
                  <span className="empty-cell">Double click to edit </span>
                )}
              </td>
              <td>
                <img
                  src={TrashCanSVG}
                  alt="Remove"
                  onClick={() => removeRow(index)}
                  style={{ cursor: "pointer" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DeviceTable;
