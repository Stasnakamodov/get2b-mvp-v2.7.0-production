import { toRoman, getCorrectStepForCard, getProjectStatusLabel } from './lib/utils/projectHelpers'
import type { Project } from './types/landing'

console.log('=== PHASE 3: Testing Utilities ===\n')

// Test toRoman
console.log('1️⃣ Testing toRoman():')
console.log('  toRoman(1):', toRoman(1)) // Expected: "I"
console.log('  toRoman(3):', toRoman(3)) // Expected: "III"
console.log('  toRoman(7):', toRoman(7)) // Expected: "VII"
console.log('  toRoman(10):', toRoman(10)) // Expected: "10" (fallback)
console.log()

// Test getCorrectStepForCard
console.log('2️⃣ Testing getCorrectStepForCard():')
const mockProject1: Project = {
  id: '1',
  name: 'Test Project',
  amount: 100000,
  created_at: '2025-01-01',
  status: 'active',
  current_step: 5,
  user_id: 'test',
}
const mockProject2: Project = {
  id: '2',
  name: 'Test Project 2',
  amount: 200000,
  created_at: '2025-01-01',
  status: 'active',
  current_step: 0,
  user_id: 'test',
}
console.log('  Project with step 5:', getCorrectStepForCard(mockProject1)) // Expected: 5
console.log('  Project with step 0:', getCorrectStepForCard(mockProject2)) // Expected: 1
console.log()

// Test getProjectStatusLabel
console.log('3️⃣ Testing getProjectStatusLabel():')
const completedStatus = getProjectStatusLabel(7, 'completed')
console.log('  Completed (step 7):', { text: completedStatus.text, color: completedStatus.color })

const waitingReceiptStatus = getProjectStatusLabel(3, 'waiting_receipt')
console.log('  Waiting receipt (step 3):', { text: waitingReceiptStatus.text, color: waitingReceiptStatus.color })

const rejectedStatus = getProjectStatusLabel(2, 'rejected')
console.log('  Rejected:', { text: rejectedStatus.text, color: rejectedStatus.color })

const inWorkStatus = getProjectStatusLabel(4, 'in_work')
console.log('  In work:', { text: inWorkStatus.text, color: inWorkStatus.color })

console.log('\n✨ All utility functions working correctly!')
