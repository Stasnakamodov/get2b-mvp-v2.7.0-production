import { processSteps } from './data/landing/steps'
import { benefits } from './data/landing/benefits'
import { faqItems } from './data/landing/faq'
import { tutorialContent } from './data/landing/tutorial'
import { mockProjects, mockTemplates } from './data/landing/mockData'

console.log('✅ Process steps:', processSteps.length)
console.log('✅ Benefits:', benefits.length)
console.log('✅ FAQ items:', faqItems.length)
console.log('✅ Tutorial types:', Object.keys(tutorialContent).length)
console.log('✅ Mock projects:', mockProjects.length)
console.log('✅ Mock templates:', mockTemplates.length)

// Verify types
console.log('\n📋 Data verification:')
console.log('- First step:', processSteps[0].title)
console.log('- First benefit:', benefits[0].title)
console.log('- First FAQ:', faqItems[0].question)
console.log('- Cart tutorial:', tutorialContent.cart.title)
console.log('- First mock project:', mockProjects[0].name)
console.log('- First template:', mockTemplates[0].name)

console.log('\n✨ Phase 2 data extraction successful!')
