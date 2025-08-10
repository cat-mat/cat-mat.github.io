import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DisplayTypeSelector from '../display-type-selector.jsx'

// Mock the app store
const mockUpdateDisplayType = jest.fn()
const mockAddNotification = jest.fn()

jest.mock('../../stores/app-store.js', () => ({
  useAppStore: () => ({
    config: {
      display_options: {
        item_display_type: 'face'
      }
    },
    updateDisplayType: mockUpdateDisplayType,
    addNotification: mockAddNotification
  })
}))

describe('DisplayTypeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all display type options', () => {
    render(<DisplayTypeSelector />)
    
    expect(screen.getByText('Text')).toBeInTheDocument()
    expect(screen.getByText('Faces')).toBeInTheDocument()
    expect(screen.getByText('Hearts')).toBeInTheDocument()
    expect(screen.getByText('Dots')).toBeInTheDocument()
  })

  it('shows current selection as active', () => {
    render(<DisplayTypeSelector />)
    
    const activeButton = screen.getByText('Faces').closest('button')
    expect(activeButton).toHaveClass('border-primary-500')
    expect(activeButton).toHaveClass('bg-gradient-to-br')
  })

  it('calls updateDisplayType when option is clicked', async () => {
    render(<DisplayTypeSelector />)
    
    const textButton = screen.getByText('Text')
    fireEvent.click(textButton)
    
    await waitFor(() => {
      expect(mockUpdateDisplayType).toHaveBeenCalledWith('text')
    })
  })

  it('applies correct styling to selected option', () => {
    render(<DisplayTypeSelector />)
    
    const selectedButton = screen.getByText('Faces').closest('button')
    const unselectedButton = screen.getByText('Text').closest('button')
    
    expect(selectedButton).toHaveClass('border-primary-500')
    expect(selectedButton).toHaveClass('bg-gradient-to-br')
    expect(unselectedButton).toHaveClass('border-cream-400')
    expect(unselectedButton).toHaveClass('bg-cream-500')
  })

  it('handles errors gracefully', async () => {
    mockUpdateDisplayType.mockRejectedValueOnce(new Error('Update failed'))
    
    render(<DisplayTypeSelector />)
    
    const textButton = screen.getByText('Text')
    fireEvent.click(textButton)
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Update failed',
        message: 'Update failed'
      })
    })
  })
}) 