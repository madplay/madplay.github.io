---
layout:   post
title:    "Binary Search Tree: Implementation in Java"
author:   Kimtaeng
tags: 	  BST BinarySearchTree DataStructure Algorithm
description: A Java implementation of a Binary Search Tree.
category: Algorithm
date: "2018-05-04 21:49:02"
comments: true
slug:     binary-search-tree-in-java
lang:     en
permalink: /en/post/binary-search-tree-in-java
---

# Implementing a Binary Search Tree
This article provides a Java-based implementation of a Binary Search Tree (BST), building upon the theoretical concepts discussed previously.

- <a href="/en/post/binary-search-tree" target="_blank">Reference: "Binary Search Tree: Theory and Introduction"</a>

First, a `Node` class is defined to represent each element within the tree. It encapsulates the node's value and references to its left and right children.

```java
/**
 * Represents a node in the Binary Search Tree.
 */
class Node {
    int value;
    Node leftChild;
    Node rightChild;

    public Node(int value) {
        this.value = value;
        this.leftChild = null;
        this.rightChild = null;
    }
}
```

<br>

The `BinaryTree` class implements the core BST operations: insertion, deletion, and the standard traversal algorithms (pre-order, in-order, and post-order).

```java
/**
 * Implements a Binary Search Tree.
 */
class BinaryTree {
    Node rootNode = null;

    /**
     * Inserts a new element into the BST.
     * The new node is placed based on the BST property.
     */
    public void insertNode(int value) {
        if (rootNode == null) {
            rootNode = new Node(value);
            return;
        }

        Node currentNode = rootNode;
        while (true) {
            if (value < currentNode.value) {
                if (currentNode.leftChild == null) {
                    currentNode.leftChild = new Node(value);
                    return;
                }
                currentNode = currentNode.leftChild;
            } else {
                if (currentNode.rightChild == null) {
                    currentNode.rightChild = new Node(value);
                    return;
                }
                currentNode = currentNode.rightChild;
            }
        }
    }

    /**
     * Removes a node with the specified value from the BST.
     * Returns true if the node is found and removed, false otherwise.
     */
    public boolean removeNode(int value) {
        Node currentNode = rootNode;
        Node parentNode = null;

        // Find the node to remove
        while (currentNode != null && currentNode.value != value) {
            parentNode = currentNode;
            if (value < currentNode.value) {
                currentNode = currentNode.leftChild;
            } else {
                currentNode = currentNode.rightChild;
            }
        }

        if (currentNode == null) {
            // Node not found
            return false;
        }

        // Case 1: Node to be deleted has no children (it is a leaf node)
        if (currentNode.leftChild == null && currentNode.rightChild == null) {
            if (currentNode == rootNode) {
                rootNode = null;
            } else if (currentNode == parentNode.leftChild) {
                parentNode.leftChild = null;
            } else {
                parentNode.rightChild = null;
            }
        }

        // Case 2: Node to be deleted has only one child
        else if (currentNode.rightChild == null) { // Has only left child
            if (currentNode == rootNode) {
                rootNode = currentNode.leftChild;
            } else if (currentNode == parentNode.leftChild) {
                parentNode.leftChild = currentNode.leftChild;
            } else {
                parentNode.rightChild = currentNode.leftChild;
            }
        } else if (currentNode.leftChild == null) { // Has only right child
            if (currentNode == rootNode) {
                rootNode = currentNode.rightChild;
            } else if (currentNode == parentNode.leftChild) {
                parentNode.leftChild = currentNode.rightChild;
            } else {
                parentNode.rightChild = currentNode.rightChild;
            }
        }

        // Case 3: Node to be deleted has two children
        else {
            Node successor = getSuccessor(currentNode);
            if (currentNode == rootNode) {
                rootNode = successor;
            } else if (currentNode == parentNode.leftChild) {
                parentNode.leftChild = successor;
            } else {
                parentNode.rightChild = successor;
            }
            successor.leftChild = currentNode.leftChild;
        }
        
        return true;
    }

    /**
     * Helper method to find the successor node for a node with two children.
     * The successor is the smallest node in the right subtree.
     */
    private Node getSuccessor(Node nodeToDelete) {
        Node successorParent = nodeToDelete;
        Node successor = nodeToDelete.rightChild;
        Node current = successor.leftChild;

        while (current != null) {
            successorParent = successor;
            successor = current;
            current = current.leftChild;
        }

        if (successor != nodeToDelete.rightChild) {
            successorParent.leftChild = successor.rightChild;
            successor.rightChild = nodeToDelete.rightChild;
        }
        return successor;
    }

    /**
     * Performs in-order traversal of the tree.
     */
    public void inorderTree(Node root, int depth) {
        if (root != null) {
            inorderTree(root.leftChild, depth + 1);
            printNode(root, depth);
            inorderTree(root.rightChild, depth + 1);
        }
    }

    /**
     * Performs post-order traversal of the tree.
     */
    public void postorderTree(Node root, int depth) {
        if (root != null) {
            postorderTree(root.leftChild, depth + 1);
            postorderTree(root.rightChild, depth + 1);
            printNode(root, depth);
        }
    }

    /**
     * Performs pre-order traversal of the tree.
     */
    public void preorderTree(Node root, int depth) {
        if (root != null) {
            printNode(root, depth);
            preorderTree(root.leftChild, depth + 1);
            preorderTree(root.rightChild, depth + 1);
        }
    }

    private void printNode(Node node, int depth) {
        for (int i = 0; i < depth; i++) {
            System.out.print("  ");
        }
        System.out.println(node.value);
    }
}
```

<br>

Finally, the execution class demonstrates the usage of the `BinaryTree`.

```java
/**
 * Test class for the BinarySearchTree implementation.
 */
class BinarySearchTreeTest {
    public static void main(String[] args) {
        BinaryTree tree = new BinaryTree();
        tree.insertNode(5);
        tree.insertNode(8);
        tree.insertNode(7);
        tree.insertNode(10);
        tree.insertNode(9);
        tree.insertNode(11);

        if (tree.removeNode(10)) {
            System.out.println("Node 10 removed successfully.");
        }

        System.out.println("\nPre-order Traversal:");
        tree.preorderTree(tree.rootNode, 0);

        // System.out.println("\nIn-order Traversal:");
        // tree.inorderTree(tree.rootNode, 0);

        // System.out.println("\nPost-order Traversal:");
        // tree.postorderTree(tree.rootNode, 0);
    }
}
```
