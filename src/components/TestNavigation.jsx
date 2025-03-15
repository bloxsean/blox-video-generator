import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

const TestNavigation = () => {
  console.log('TestNavigation: Component rendering');
  
  let contextData = null;
  let contextError = null;
  
  try {
    // Safely try to access navigation context
    const context = useNavigation();
    contextData = {
      activeTab: context.activeTab,
      hasWorkflowState: !!context.workflowState,
      hasSteps: Array.isArray(context.steps),
      stepsLength: context.steps?.length || 0,
      hasNavigateFunction: typeof context.navigateToTab === 'function'
    };
    
    console.log('TestNavigation: Successfully connected to NavigationContext!', contextData);
  } catch (error) {
    contextError = error;
    console.error('TestNavigation: Error using NavigationContext', error);
  }
  
  if (contextData) {
    // If context is available, render normal component
    const { activeTab } = contextData;
    
    return (
      <div style={{ 
        padding: '15px', 
        border: '2px solid green', 
        margin: '15px', 
        borderRadius: '5px',
        backgroundColor: '#f0fff0'
      }}>
        <h3 style={{ marginTop: 0 }}>Navigation Context Test ✅</h3>
        <p>Current Tab: <strong>{activeTab}</strong></p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {typeof useNavigation().navigateToTab === 'function' ? (
            <>
              <button onClick={() => useNavigation().navigateToTab('home')}>Home</button>
              <button onClick={() => useNavigation().navigateToTab('voices')}>Voices</button>
              <button onClick={() => useNavigation().navigateToTab('avatars')}>Avatars</button>
            </>
          ) : (
            <p style={{ color: 'orange' }}>Navigation function not available</p>
          )}
        </div>
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          <p style={{ margin: '5px 0' }}>Provider debug info:</p>
          <pre style={{ margin: 0 }}>{JSON.stringify(contextData, null, 2)}</pre>
        </div>
      </div>
    );
  } else {
    // If context is not available, render error state
    return (
      <div style={{ 
        padding: '15px', 
        border: '2px solid red', 
        margin: '15px', 
        borderRadius: '5px',
        backgroundColor: '#fff0f0'
      }}>
        <h3 style={{ marginTop: 0 }}>Navigation Context Error ❌</h3>
        <p style={{ color: 'red' }}>Error: {contextError?.message || "Unknown error"}</p>
        <div style={{ marginTop: '10px' }}>
          <p style={{ margin: '5px 0' }}><strong>Provider Status:</strong></p>
          <ul style={{ margin: '5px 0' }}>
            <li>Context Provider Found: <strong>No</strong></li>
            <li>Error Type: <strong>{contextError?.name || "Unknown"}</strong></li>
            <li>React Version: <strong>{React.version}</strong></li>
          </ul>
        </div>
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
          <p>Check that:</p>
          <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>The NavigationProvider is properly set up in main.jsx</li>
            <li>There are no circular dependencies between component files</li>
            <li>The right import is being used: import &#123; useNavigation &#125; from '../contexts/NavigationContext'</li>
          </ol>
        </div>
      </div>
    );
  }
};

export default TestNavigation; 