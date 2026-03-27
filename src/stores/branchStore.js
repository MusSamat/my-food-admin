import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAdminBranchStore = create(
    persist(
        (set) => ({
            selectedBranchId: null,
            setSelectedBranch: (id) => set({ selectedBranchId: id }),
        }),
        { name: 'admin-branch' }
    )
);

export default useAdminBranchStore;