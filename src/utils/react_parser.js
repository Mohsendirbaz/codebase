import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

/**
 * Parse React component files to extract component definitions, hooks usage,
 * and JSX structure
 */
export async function parseComponent(content, filePath) {
  const ast = babelParser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties']
  });
  
  const result = {
    components: [],
    hooks: [],
    imports: [],
    exports: [],
    jsx: []
  };
  
  // Visitor for analyzing component structure
  const visitor = {
    // Identify React.Component class components
    ClassDeclaration(path) {
      const superClass = path.node.superClass;
      if (isReactComponent(superClass)) {
        result.components.push({
          type: 'class',
          name: path.node.id.name,
          methods: extractClassMethods(path),
          props: extractPropsFromClass(path),
          state: extractStateFromClass(path)
        });
      }
    },
    
    // Identify function components
    FunctionDeclaration(path) {
      if (isFunctionComponent(path)) {
        result.components.push({
          type: 'function',
          name: path.node.id.name,
          hooks: extractHooks(path),
          props: extractPropsFromFunction(path),
          jsxStructure: extractJSXStructure(path)
        });
      }
    },
    
    // Arrow function components
    VariableDeclarator(path) {
      if (t.isArrowFunctionExpression(path.node.init) && isFunctionComponent(path)) {
        result.components.push({
          type: 'arrow',
          name: path.node.id.name,
          hooks: extractHooks(path.get('init')),
          props: extractPropsFromArrow(path),
          jsxStructure: extractJSXStructure(path.get('init'))
        });
      }
    },
    
    // Track hook usage
    CallExpression(path) {
      if (isReactHook(path.node.callee)) {
        result.hooks.push({
          name: path.node.callee.name,
          args: extractHookArguments(path),
          location: path.node.loc
        });
      }
    },
    
    // Track imports
    ImportDeclaration(path) {
      result.imports.push({
        source: path.node.source.value,
        specifiers: path.node.specifiers.map(specifier => ({
          type: specifier.type,
          imported: specifier.imported ? specifier.imported.name : null,
          local: specifier.local.name
        }))
      });
    },
    
    // Track exports
    ExportNamedDeclaration(path) {
      if (path.node.declaration) {
        let name;
        if (t.isFunctionDeclaration(path.node.declaration)) {
          name = path.node.declaration.id.name;
        } else if (t.isVariableDeclaration(path.node.declaration)) {
          name = path.node.declaration.declarations[0].id.name;
        }
        
        if (name) {
          result.exports.push({
            type: 'named',
            name
          });
        }
      }
    },
    
    ExportDefaultDeclaration(path) {
      let name;
      if (t.isIdentifier(path.node.declaration)) {
        name = path.node.declaration.name;
      } else if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
        name = path.node.declaration.id.name;
      }
      
      if (name) {
        result.exports.push({
          type: 'default',
          name
        });
      }
    }
  };
  
  traverse(ast, visitor);
  return result;
}

// Helper functions for component analysis
function isReactComponent(node) {
  // Check if the class extends React.Component or Component
  if (!node) return false;
  
  // Case: extends React.Component
  if (
    t.isMemberExpression(node) &&
    t.isIdentifier(node.object) &&
    node.object.name === 'React' &&
    t.isIdentifier(node.property) &&
    (node.property.name === 'Component' || node.property.name === 'PureComponent')
  ) {
    return true;
  }
  
  // Case: extends Component (directly imported)
  if (
    t.isIdentifier(node) &&
    (node.name === 'Component' || node.name === 'PureComponent')
  ) {
    return true;
  }
  
  return false;
}

function isFunctionComponent(path) {
  // Check if a function or arrow function returns JSX
  let returnStatement;
  let hasJSXReturn = false;
  
  // For function declarations
  if (t.isFunctionDeclaration(path.node)) {
    const body = path.node.body;
    if (t.isBlockStatement(body)) {
      // Look for return statements in the function body
      path.traverse({
        ReturnStatement(returnPath) {
          if (returnPath.scope.getFunctionParent() === path.scope) {
            const returnArg = returnPath.node.argument;
            if (
              t.isJSXElement(returnArg) ||
              t.isJSXFragment(returnArg) ||
              (t.isCallExpression(returnArg) && 
               t.isMemberExpression(returnArg.callee) && 
               returnArg.callee.property.name === 'createElement')
            ) {
              hasJSXReturn = true;
            }
          }
        }
      });
    }
  } 
  // For arrow functions
  else if (t.isArrowFunctionExpression(path.node)) {
    const body = path.node.body;
    if (t.isBlockStatement(body)) {
      // Look for return statements in the arrow function body
      path.traverse({
        ReturnStatement(returnPath) {
          if (returnPath.scope.getFunctionParent() === path.scope) {
            const returnArg = returnPath.node.argument;
            if (
              t.isJSXElement(returnArg) ||
              t.isJSXFragment(returnArg) ||
              (t.isCallExpression(returnArg) && 
               t.isMemberExpression(returnArg.callee) && 
               returnArg.callee.property.name === 'createElement')
            ) {
              hasJSXReturn = true;
            }
          }
        }
      });
    } else if (
      t.isJSXElement(body) ||
      t.isJSXFragment(body) ||
      (t.isCallExpression(body) && 
       t.isMemberExpression(body.callee) && 
       body.callee.property.name === 'createElement')
    ) {
      // Arrow function with implicit return of JSX
      hasJSXReturn = true;
    }
  }
  
  // Check if the function has props parameter (common in React components)
  const hasPropsParam = path.node.params && path.node.params.length > 0;
  
  // A function is likely a React component if it returns JSX
  return hasJSXReturn || (hasPropsParam && path.node.id && /^[A-Z]/.test(path.node.id.name));
}

function extractHooks(path) {
  const hooks = [];
  
  // Traverse the function body to find hook calls
  path.traverse({
    CallExpression(callPath) {
      if (isReactHook(callPath.node.callee)) {
        hooks.push({
          name: callPath.node.callee.name,
          args: extractHookArguments(callPath),
          location: callPath.node.loc
        });
      }
    }
  });
  
  return hooks;
}

function extractClassMethods(path) {
  const methods = [];
  
  // Get all class methods
  path.traverse({
    ClassMethod(methodPath) {
      // Skip constructor and render methods
      if (
        methodPath.node.key.name !== 'constructor' &&
        methodPath.node.key.name !== 'render'
      ) {
        methods.push({
          name: methodPath.node.key.name,
          params: methodPath.node.params.map(param => {
            if (t.isIdentifier(param)) {
              return param.name;
            } else if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
              return {
                name: param.left.name,
                defaultValue: param.right.value
              };
            }
            return null;
          }).filter(Boolean),
          isAsync: methodPath.node.async,
          isGenerator: methodPath.node.generator,
          isStatic: methodPath.node.static
        });
      }
    }
  });
  
  return methods;
}

function extractPropsFromClass(path) {
  const props = {
    usage: [],
    defaultProps: null
  };
  
  // Check for this.props usage in methods
  path.traverse({
    MemberExpression(memberPath) {
      if (
        t.isThisExpression(memberPath.node.object) &&
        t.isIdentifier(memberPath.node.property, { name: 'props' })
      ) {
        // If we have this.props.something
        if (
          memberPath.parent &&
          t.isMemberExpression(memberPath.parent) &&
          t.isIdentifier(memberPath.parent.property)
        ) {
          const propName = memberPath.parent.property.name;
          if (!props.usage.includes(propName)) {
            props.usage.push(propName);
          }
        }
      }
    }
  });
  
  // Check for static defaultProps
  path.traverse({
    ClassProperty(propPath) {
      if (
        propPath.node.static &&
        t.isIdentifier(propPath.node.key, { name: 'defaultProps' }) &&
        t.isObjectExpression(propPath.node.value)
      ) {
        props.defaultProps = propPath.node.value.properties.map(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            return {
              name: prop.key.name,
              value: prop.value.value // This is simplified, might need more complex extraction
            };
          }
          return null;
        }).filter(Boolean);
      }
    }
  });
  
  return props;
}

function extractPropsFromFunction(path) {
  const props = {
    parameters: [],
    destructured: [],
    usage: []
  };
  
  // Check function parameters
  if (path.node.params.length > 0) {
    const firstParam = path.node.params[0];
    
    // Case: function Component(props) { ... }
    if (t.isIdentifier(firstParam)) {
      props.parameters.push(firstParam.name);
      
      // Look for props usage
      path.traverse({
        MemberExpression(memberPath) {
          if (
            t.isIdentifier(memberPath.node.object, { name: firstParam.name }) &&
            t.isIdentifier(memberPath.node.property)
          ) {
            const propName = memberPath.node.property.name;
            if (!props.usage.includes(propName)) {
              props.usage.push(propName);
            }
          }
        }
      });
    }
    // Case: function Component({ prop1, prop2 }) { ... }
    else if (t.isObjectPattern(firstParam)) {
      firstParam.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          props.destructured.push(prop.key.name);
        } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
          props.destructured.push(`...${prop.argument.name}`);
        }
      });
    }
  }
  
  return props;
}

function extractPropsFromArrow(path) {
  const props = {
    parameters: [],
    destructured: [],
    usage: []
  };
  
  // Get the arrow function
  const arrowFunction = path.node.init;
  if (!arrowFunction || !arrowFunction.params) return props;
  
  // Check arrow function parameters
  if (arrowFunction.params.length > 0) {
    const firstParam = arrowFunction.params[0];
    
    // Case: (props) => { ... }
    if (t.isIdentifier(firstParam)) {
      props.parameters.push(firstParam.name);
      
      // Look for props usage
      path.traverse({
        MemberExpression(memberPath) {
          if (
            t.isIdentifier(memberPath.node.object, { name: firstParam.name }) &&
            t.isIdentifier(memberPath.node.property)
          ) {
            const propName = memberPath.node.property.name;
            if (!props.usage.includes(propName)) {
              props.usage.push(propName);
            }
          }
        }
      });
    }
    // Case: ({ prop1, prop2 }) => { ... }
    else if (t.isObjectPattern(firstParam)) {
      firstParam.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          props.destructured.push(prop.key.name);
        } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
          props.destructured.push(`...${prop.argument.name}`);
        }
      });
    }
  }
  
  return props;
}

function extractStateFromClass(path) {
  const state = {
    initialState: null,
    setStateUsage: []
  };
  
  // Check for state initialization in constructor
  path.traverse({
    ClassMethod(methodPath) {
      if (t.isIdentifier(methodPath.node.key, { name: 'constructor' })) {
        methodPath.traverse({
          AssignmentExpression(assignPath) {
            if (
              t.isMemberExpression(assignPath.node.left) &&
              t.isThisExpression(assignPath.node.left.object) &&
              t.isIdentifier(assignPath.node.left.property, { name: 'state' }) &&
              t.isObjectExpression(assignPath.node.right)
            ) {
              state.initialState = assignPath.node.right.properties.map(prop => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                  return prop.key.name;
                }
                return null;
              }).filter(Boolean);
            }
          }
        });
      }
    },
    
    // Check for state initialization as class property
    ClassProperty(propPath) {
      if (
        t.isIdentifier(propPath.node.key, { name: 'state' }) &&
        t.isObjectExpression(propPath.node.value)
      ) {
        state.initialState = propPath.node.value.properties.map(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            return prop.key.name;
          }
          return null;
        }).filter(Boolean);
      }
    },
    
    // Track setState calls
    CallExpression(callPath) {
      if (
        t.isMemberExpression(callPath.node.callee) &&
        t.isThisExpression(callPath.node.callee.object) &&
        t.isIdentifier(callPath.node.callee.property, { name: 'setState' })
      ) {
        if (
          callPath.node.arguments.length > 0 &&
          t.isObjectExpression(callPath.node.arguments[0])
        ) {
          const stateUpdates = callPath.node.arguments[0].properties.map(prop => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
              return prop.key.name;
            }
            return null;
          }).filter(Boolean);
          
          state.setStateUsage.push(...stateUpdates);
        }
      }
    }
  });
  
  // Remove duplicates from setStateUsage
  state.setStateUsage = [...new Set(state.setStateUsage)];
  
  return state;
}

function extractJSXStructure(path) {
  const jsxElements = [];
  
  // Find JSX elements in the component
  path.traverse({
    JSXElement(jsxPath) {
      const element = {
        type: jsxPath.node.openingElement.name.name,
        props: jsxPath.node.openingElement.attributes.map(attr => {
          if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
            return {
              name: attr.name.name,
              value: attr.value && attr.value.value // Simplified, might need more complex extraction
            };
          }
          return null;
        }).filter(Boolean),
        children: []
      };
      
      // Only add top-level JSX elements
      if (
        !t.isJSXElement(jsxPath.parent) &&
        !t.isJSXFragment(jsxPath.parent)
      ) {
        jsxElements.push(element);
      }
    },
    
    // Also check for React.createElement calls
    CallExpression(callPath) {
      if (
        t.isMemberExpression(callPath.node.callee) &&
        t.isIdentifier(callPath.node.callee.object, { name: 'React' }) &&
        t.isIdentifier(callPath.node.callee.property, { name: 'createElement' }) &&
        callPath.node.arguments.length >= 1
      ) {
        const element = {
          type: callPath.node.arguments[0].value || 
                (callPath.node.arguments[0].name || 'Unknown'),
          props: callPath.node.arguments[1] && t.isObjectExpression(callPath.node.arguments[1]) ?
            callPath.node.arguments[1].properties.map(prop => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                return {
                  name: prop.key.name,
                  value: prop.value.value // Simplified
                };
              }
              return null;
            }).filter(Boolean) : [],
          children: []
        };
        
        // Only add top-level createElement calls
        if (
          !t.isCallExpression(callPath.parent) ||
          !t.isMemberExpression(callPath.parent.callee) ||
          !t.isIdentifier(callPath.parent.callee.property, { name: 'createElement' })
        ) {
          jsxElements.push(element);
        }
      }
    }
  });
  
  return jsxElements;
}

function isReactHook(callee) {
  // Check if the function call is a React hook
  if (!t.isIdentifier(callee)) return false;
  
  // Built-in React hooks start with 'use' and have a capital letter after 'use'
  const hookName = callee.name;
  return hookName.startsWith('use') && 
         hookName.length > 3 && 
         hookName[3] === hookName[3].toUpperCase();
}

function extractHookArguments(path) {
  const args = [];
  
  // Extract arguments from hook calls
  if (path.node.arguments && path.node.arguments.length > 0) {
    path.node.arguments.forEach((arg, index) => {
      if (t.isLiteral(arg)) {
        // For primitive values
        args.push({
          type: 'literal',
          value: arg.value
        });
      } else if (t.isIdentifier(arg)) {
        // For variables
        args.push({
          type: 'identifier',
          name: arg.name
        });
      } else if (t.isArrayExpression(arg)) {
        // For dependency arrays (common in useEffect, useMemo, etc.)
        args.push({
          type: 'array',
          elements: arg.elements.map(element => {
            if (t.isIdentifier(element)) {
              return element.name;
            } else if (t.isLiteral(element)) {
              return element.value;
            }
            return null;
          }).filter(Boolean)
        });
      } else if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
        // For callback functions
        args.push({
          type: 'function',
          async: arg.async,
          params: arg.params.map(param => {
            if (t.isIdentifier(param)) {
              return param.name;
            }
            return null;
          }).filter(Boolean)
        });
      } else if (t.isObjectExpression(arg)) {
        // For object arguments
        args.push({
          type: 'object',
          properties: arg.properties.map(prop => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
              return prop.key.name;
            }
            return null;
          }).filter(Boolean)
        });
      } else {
        // For other types of arguments
        args.push({
          type: 'unknown',
          nodeType: arg.type
        });
      }
    });
  }
  
  return args;
}