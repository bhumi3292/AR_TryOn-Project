import React from "react";
import { Button } from "./Button";

export function Table({ headers, data, onEdit, onDelete, loading = false }) {
  if (loading) {
    return <div className="text-center text-luxury-gold py-8">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 border border-dashed border-luxury-gold rounded-lg">
        No items found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-luxury-dark border border-luxury-gold rounded-xl">
      <table className="w-full">
        <thead>
          <tr className="border-b border-luxury-gold">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-6 py-4 text-left text-luxury-gold font-semibold"
              >
                {header}
              </th>
            ))}
            <th className="px-6 py-4 text-left text-luxury-gold font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-luxury-gray hover:bg-luxury-gray transition"
            >
              {Object.values(row)
                .slice(0, headers.length)
                .map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-6 py-4 text-gray-300">
                    {typeof cell === "object" ? JSON.stringify(cell) : cell}
                  </td>
                ))}
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(row)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onDelete(row.id || row._id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
