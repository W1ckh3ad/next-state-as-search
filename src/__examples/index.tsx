import { z } from "zod";
import { useCreateSetStateDispatch, useSearch } from "../hooks";

const schema = z.object({
  modalOpen: z.boolean(),
  rows: z.number().optional().default(100),
  selected: z.array(z.string()).optional(),
  x: z
    .object({
      y: z.string().optional(),
    })
    .optional(),
});

const SearchPage = () => {
  const { search, setSearch, error } = useSearch<typeof schema>(schema);
  //          ^?

  const setOpenModal = useCreateSetStateDispatch<boolean>(
    search?.modalOpen ?? false,
    (modalOpen) => setSearch((x) => ({ ...x, modalOpen: modalOpen ?? false }))
  );

  return (
    <div className="flex flex-col gap-x4">
      <button
        onClick={() => setSearch((x) => ({ ...x, modalOpen: true, rows: 300 }))}
      >
        3
      </button>
      <button
        onClick={() =>
          setSearch((x) => ({ ...x, modalOpen: false, rows: 1000 }))
        }
      >
        3
      </button>
      <button
        onClick={() => {
          setSearch((x) => ({ ...x, modalOpen: true }));
        }}
      >
        Toggle Modal
      </button>
      <div>
        <label>Rows</label>
        <select
          value={search?.rows}
          onChange={(e) =>
            setSearch((x) => ({ ...x, rows: (e.target as any).value }))
          }
        >
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={300}>300</option>
          <option value={1000}>1000</option>
        </select>
      </div>
      {/* <Modal show={search?.modalOpen} setShow={setOpenModal} heading="Test">
        Hallo
      </Modal> */}
      {search?.modalOpen && (
        <div>
          Open with modelOpen
          <button onClick={() => setOpenModal(false)}>Close Modal</button>
        </div>
      )}
      {error && error.issues.map((x) => x.message + "\n")}
      <input
        value={search?.selected?.join?.(";") ?? ""}
        onChange={(e) =>
          setSearch((x) => ({ ...x, selected: e.target.value.split(";") }))
        }
      />
      {search?.selected?.map?.((x, i) => (
        <div key={i + x}>{x}</div>
      ))}
    </div>
  );
};

export default SearchPage;
