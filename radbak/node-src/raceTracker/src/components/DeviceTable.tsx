import { useState } from "react";
import "./DeviceTable.css";
import TrashCanSVG from "../assets/trashcan.svg";

interface DeviceTableProps {
  onDataUpdate: (newData: any) => void;
}

function DeviceTable({ onDataUpdate }: DeviceTableProps) {
  const [data, setData] = useState([
    { position: 1, value: "", isEditing: false, tempValue: "" },
    { position: 2, value: "", isEditing: false, tempValue: "" },
    // Add more rows as needed
  ]);

  // Function to handle starting editing mode
  const handleEdit = (index: number) => {
    const newData = [...data];
    newData[index].isEditing = true;
    newData[index].tempValue = newData[index].value; // Store the original value
    setData(newData);
  };

  // Function to handle finishing editing mode
  const handleFinishEdit = (index: number, newValue: string) => {
    const newData = [...data];
    newData[index].value = newValue;
    newData[index].isEditing = false;
    setData(newData);
    onDataUpdate(newData);
  };

  // Function to handle canceling editing mode
  const handleCancelEdit = (index: number) => {
    const newData = [...data];
    newData[index].value = newData[index].tempValue; // Restore the original value
    newData[index].isEditing = false;
    setData(newData);
  };

  // Function to handle dragging and rearranging rows
  const handleDragStart = (
    event: React.DragEvent<HTMLTableCellElement>,
    index: number
  ) => {
    event.dataTransfer.setData("index", index.toString());
    event.dataTransfer.setData("value", data[index].value);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLTableRowElement>,
    dropIndex: number
  ) => {
    const draggedIndex = parseInt(event.dataTransfer.getData("index"));
    const draggedValue = event.dataTransfer.getData("value");

    // Swap the values of dragged and dropped cells
    const newData = [...data];
    newData[draggedIndex].value = data[dropIndex].value;
    newData[dropIndex].value = draggedValue;

    setData(newData);
    onDataUpdate(newData);
  };

  // Function to add a new row
  const addRow = () => {
    const newPosition = data.length + 1;
    setData([
      ...data,
      { position: newPosition, value: "", isEditing: false, tempValue: "" },
    ]);
  };

  // Function to remove a row
  const removeRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData.map((item, i) => ({ ...item, position: i + 1 })));
  };

  return (
    <div className="App">
      <button onClick={addRow}>Add Row</button>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>DeviceID</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
            >
              <td>{item.position}</td>
              <td
                className={`editable-cell`}
                onDoubleClick={() => handleEdit(index)}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
              >
                {item.isEditing ? (
                  <input
                    type="text"
                    placeholder="Enter DeviceID"
                    value={item.value}
                    onChange={(e) =>
                      setData(
                        data.map((row, i) =>
                          i === index ? { ...row, value: e.target.value } : row
                        )
                      )
                    }
                    autoFocus
                    onBlur={() => handleFinishEdit(index, data[index].value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") handleCancelEdit(index);
                      if (e.key === "Enter")
                        handleFinishEdit(index, data[index].value);
                    }}
                  />
                ) : item.value ? (
                  item.value
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
