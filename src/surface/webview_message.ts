export type WebviewFrontendMessage =
    | {
          command: "CHOOSE_MESH";
      }
    | {
          command: "CHOOSE_MAP";
      }
    | {
          command: "SET_MAP";
          path: string;
      }
    | {
          command: "SET_MESH";
          path: string;
      };

type SelectEntry = {
    value: string;
    label: string;
};

export type WebviewBackendMessage = {
    command: "SET_STATE";
    data: {
        mesh: { vertices: ArrayBufferLike; faces: ArrayBufferLike } | null;
        map: ArrayBufferLike | null;
    };
    selectMeshEntries: SelectEntry[];
    selectMapEntries: SelectEntry[];
};
