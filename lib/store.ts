// Временно отключен из-за ошибок типов
// Этот файл не используется в конструкторе проектов

/*
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import {
  type CompanyCard,
  type BankAccount,
  type SpecificationItemsRequest,
  type ProjectDraft,
  type Project,
  type ProjectID,
  createProjectID,
} from "./types"
import { STORAGE_KEYS } from "./constants"
import { saveToStorage, loadFromStorage, cleanupStorage } from "./storage"

// Import mock data
import { mockCompanies, mockBankAccounts, mockSpecifications } from "./mock-data"

// Initial state for the project constructor
const initialConstructorState = {
  selectedCompany: null,
  selectedBankAccount: null,
  selectedInvoiceType: "new",
  selectedSpecificationId: null,
  selectedItems: [],
  searchQuery: "",
  statusFilter: "all",
  activeTab: "companies",
  newSpecificationItems: {
    supplier: "",
    currency: "USD",
    expectedDeliveryDate: "",
    additionalInfo: "",
    items: [
      {
        id: "new-1",
        name: "",
        code: "",
        quantity: 0,
        unit: "шт",
        price: 0,
        total: 0,
      },
    ],
  },
}

// Interface for the projects state
interface ProjectsState {
  // Data
  companies: CompanyCard[]
  bankAccounts: Record<string, BankAccount[]>
  specificationItemsList: SpecificationRequest[]
  drafts: ProjectDraft[]
  projects: Project[]

  // Current state of the project constructor
  constructor: {
    selectedCompany: string | null
    selectedBankAccount: string | null
    selectedInvoiceType: string
    selectedSpecificationId: string | null
    selectedItems: { specId: string; itemIds: string[] }[]
    searchQuery: string
    statusFilter: string
    activeTab: string
    newSpecificationItems: {
      supplier: string
      currency: string
      expectedDeliveryDate: string
      additionalInfo: string
      items: {
        id: string
        name: string
        code: string
        quantity: number
        unit: string
        price: number
        total: number
      }[]
    }
  }

  // Actions
  setSelectedCompany: (companyId: string | null) => void
  setSelectedBankAccount: (accountId: string | null) => void
  setSelectedInvoiceType: (typeId: string) => void
  setSelectedSpecificationId: (specId: string | null) => void
  toggleItemSelection: (specId: string, itemId: string) => void
  setSearchQuery: (query: string) => void
  setStatusFilter: (filter: string) => void
  setActiveTab: (tab: string) => void
  updateNewSpecificationItems: (data: Partial<ProjectsState["constructor"]["newSpecificationItems"]>) => void
  addNewSpecificationItem: () => void
  removeSpecificationItem: (itemId: string) => void
  updateSpecificationItem: (itemId: string, field: string, value: any) => void

  // Save and load
  saveDraft: () => string
  loadDraft: (draftId: string) => void
  createProject: () => ProjectID | null
  loadProject: (projectId: ProjectID) => void

  // Utilities
  resetConstructor: () => void
  getStorageInfo: () => { used: number; available: number; percentage: number }
}

// Create the store
export const useProjectsStore = create<ProjectsState>()(
  persist(
    immer((set, get) => ({
      // Initial data
      companies: mockCompanies,
      bankAccounts: mockBankAccounts,
      specificationItemsList: mockSpecifications,
      drafts: loadFromStorage<ProjectDraft[]>(STORAGE_KEYS.DRAFTS, []),
      projects: [],

      // Initial state of the constructor
      constructor: { ...initialConstructorState },

      // Actions for the project constructor
      setSelectedCompany: (companyId) =>
        set((state) => {
          state.constructor.selectedCompany = companyId

          // Automatically select the default account
          if (companyId) {
            const defaultAccount = state.bankAccounts[companyId]?.find((acc) => acc.isDefault)
            if (defaultAccount) {
              state.constructor.selectedBankAccount = `${companyId}:${defaultAccount.id}`
            } else if (state.bankAccounts[companyId]?.length > 0) {
              state.constructor.selectedBankAccount = `${companyId}:${state.bankAccounts[companyId][0].id}`
            } else {
              state.constructor.selectedBankAccount = null
            }
          } else {
            state.constructor.selectedBankAccount = null
          }
        }),

      setSelectedBankAccount: (accountId) =>
        set((state) => {
          state.constructor.selectedBankAccount = accountId
        }),

      setSelectedInvoiceType: (typeId) =>
        set((state) => {
          state.constructor.selectedInvoiceType = typeId
        }),

      setSelectedSpecificationId: (specId) =>
        set((state) => {
          if (state.constructor.selectedSpecificationId === specId) {
            // If the specification is already selected, deselect it
            state.constructor.selectedSpecificationId = null
            // Also deselect all items of this specification
            state.constructor.selectedItems = state.constructor.selectedItems.filter((item) => item.specId !== specId)
          } else {
            // Select the new specification
            state.constructor.selectedSpecificationId = specId
          }
        }),

      toggleItemSelection: (specId, itemId) =>
        set((state) => {
          // Check if there is already a record for this specification
          const specItemsIndex = state.constructor.selectedItems.findIndex((item) => item.specId === specId)

          if (specItemsIndex >= 0) {
            // If there is a record, check if this item is already selected
            const itemIds = state.constructor.selectedItems[specItemsIndex].itemIds

            if (itemIds.includes(itemId)) {
              // If the item is already selected, deselect it
              state.constructor.selectedItems[specItemsIndex].itemIds = itemIds.filter((id) => id !== itemId)

              // If there are no more selected items, remove the record for the specification
              if (state.constructor.selectedItems[specItemsIndex].itemIds.length === 0) {
                state.constructor.selectedItems.splice(specItemsIndex, 1)
              }
            } else {
              // Add the item to the selected ones
              state.constructor.selectedItems[specItemsIndex].itemIds.push(itemId)
            }
          } else {
            // If there is no record, create a new one
            state.constructor.selectedItems.push({ specId, itemIds: [itemId] })

            // If the specification is not selected, select it
            if (state.constructor.selectedSpecificationId !== specId) {
              state.constructor.selectedSpecificationId = specId
            }
          }
        }),

      setSearchQuery: (query) =>
        set((state) => {
          state.constructor.searchQuery = query
        }),

      setStatusFilter: (filter) =>
        set((state) => {
          state.constructor.statusFilter = filter
        }),

      setActiveTab: (tab) =>
        set((state) => {
          state.constructor.activeTab = tab
        }),

      updateNewSpecificationItems: (data) =>
        set((state) => {
          state.constructor.newSpecificationItems = {
            ...state.constructor.newSpecificationItems,
            ...data,
          }
        }),

      addNewSpecificationItem: () =>
        set((state) => {
          state.constructor.newSpecificationItems.items.push({
            id: `new-${state.constructor.newSpecificationItems.items.length + 1}`,
            name: "",
            code: "",
            quantity: 0,
            unit: "шт",
            price: 0,
            total: 0,
          })
        }),

      removeSpecificationItem: (itemId) =>
        set((state) => {
          state.constructor.newSpecificationItems.items = state.constructor.newSpecificationItems.items.filter(
            (item) => item.id !== itemId,
          )
        }),

      updateSpecificationItem: (itemId, field, value) =>
        set((state) => {
          const itemIndex = state.constructor.newSpecificationItems.items.findIndex((item) => item.id === itemId)

          if (itemIndex !== -1) {
            const item = state.constructor.newSpecificationItems.items[itemIndex]

            // Update the field
            item[field] = value

            // If the quantity or price has changed, recalculate the total cost
            if (field === "quantity" || field === "price") {
              item.total = item.quantity * item.price
            }
          }
        }),

      // Save and load
      saveDraft: () => {
        const state = get()

        // Check that a company is selected
        if (!state.constructor.selectedCompany) {
          throw new Error("Необходимо выбрать компанию для сохранения черновика")
        }

        // Create a new draft
        const newDraft: ProjectDraft = {
          id: `draft-${Date.now()}`,
          createdAt: new Date().toISOString(),
          company: state.constructor.selectedCompany,
          bankAccount: state.constructor.selectedBankAccount,
          invoiceType: state.constructor.selectedInvoiceType,
          specification: state.constructor.selectedSpecificationId,
          selectedItems: state.constructor.selectedItems,
          newSpecification:
            state.constructor.activeTab === "newSpecificationItems" ? state.constructor.newSpecificationItems : null,
        }

        // Add the draft to the list
        set((state) => {
          state.drafts.push(newDraft)
        })

        // Save to localStorage
        const updatedDrafts = [...get().drafts]
        saveToStorage(STORAGE_KEYS.DRAFTS, updatedDrafts)

        // Clean up storage if needed
        const cleanedDrafts = cleanupStorage(STORAGE_KEYS.DRAFTS, updatedDrafts)
        if (cleanedDrafts.length !== updatedDrafts.length) {
          set((state) => {
            state.drafts = cleanedDrafts
          })
        }

        return newDraft.id
      },

      loadDraft: (draftId) => {
        const state = get()
        const draft = state.drafts.find((d) => d.id === draftId)

        if (!draft) {
          throw new Error(`Черновик с ID ${draftId} не найден`)
        }

        // Load data from the draft
        set((state) => {
          state.constructor.selectedCompany = draft.company
          state.constructor.selectedBankAccount = draft.bankAccount
          state.constructor.selectedInvoiceType = draft.invoiceType
          state.constructor.selectedSpecificationId = draft.specification
          state.constructor.selectedItems = draft.selectedItems

          if (draft.newSpecification) {
            state.constructor.newSpecificationItems = draft.newSpecification
            state.constructor.activeTab = "newSpecificationItems"
          } else {
            state.constructor.activeTab = draft.specification ? "specificationItemsList" : "companies"
          }
        })
      },

      createProject: () => {
        const state = get()

        // Check that a company is selected
        if (!state.constructor.selectedCompany) {
          throw new Error("Необходимо выбрать компанию для создания проекта")
        }

        // Check that a bank account is selected
        if (!state.constructor.selectedBankAccount) {
          throw new Error("Необходимо выбрать банковский счет для создания проекта")
        }

        // Collect data for creating the project
        const [companyId, accountId] = state.constructor.selectedBankAccount.split(":")
        const company = state.companies.find((c) => c.id === state.constructor.selectedCompany)
        const bankAccount = state.bankAccounts[companyId]?.find((acc) => acc.id === accountId)
        const specification = state.constructor.selectedSpecificationId
          ? state.specificationItemsList.find((s) => s.id === state.constructor.selectedSpecificationId)
          : null

        if (!company || !bankAccount) {
          throw new Error("Не удалось найти выбранную компанию или банковский счет")
        }

        // Collect selected items
        const selectedItemsData = []
        if (state.constructor.selectedItems.length > 0) {
          for (const item of state.constructor.selectedItems) {
            const spec = state.specificationItemsList.find((s) => s.id === item.specId)
            if (spec) {
              const items = spec.items.filter((i) => item.itemIds.includes(i.id))
              if (items.length > 0) {
                selectedItemsData.push({
                  specification: spec,
                  items: items,
                })
              }
            }
          }
        }

        // Create a new project
        const projectId = createProjectID(`project-${Date.now()}`)
        const newProject: Project = {
          id: projectId,
          title: specification?.title || "Новый проект",
          company,
          bankAccount,
          invoiceType: state.constructor.selectedInvoiceType,
          specification,
          selectedItems: selectedItemsData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active",
        }

        // Add the project to the list
        set((state) => {
          state.projects.push(newProject)
        })

        // Save to localStorage
        saveToStorage(STORAGE_KEYS.PROJECTS, [...get().projects])

        // Reset the constructor state
        get().resetConstructor()

        return projectId
      },

      loadProject: (projectId) => {
        const state = get()
        const project = state.projects.find((p) => p.id === projectId)

        if (!project) {
          throw new Error(`Проект с ID ${projectId} не найден`)
        }

        // Here you can add logic for loading the project
        // For example, navigating to the project page
      },

      // Utilities
      resetConstructor: () =>
        set((state) => {
          state.constructor = { ...initialConstructorState }
        }),

      getStorageInfo: () => {
        let total = 0
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            const value = localStorage.getItem(key) || ""
            total += key.length + value.length
          }
        }

        // Approximate size of localStorage in most browsers (in bytes)
        const quota = 5 * 1024 * 1024 // 5MB
        const available = Math.max(0, quota - total)
        const percentage = (total / quota) * 100

        return {
          used: total,
          available,
          percentage,
        }
      },
    })),
    {
      name: "projects-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        drafts: state.drafts,
        projects: state.projects,
      }),
      // Data schema versioning
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
        }
      },
    },
  ),
)
*/
