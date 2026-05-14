import { Request, Response } from 'express';
import Category from '../models/category.model.js';
import PlacementQuestion from '../models/placement.model.js';

// GET /api/categories — list all categories with linked question counts
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();

    // For each category, count questions by matching category name in PlacementQuestion
    const result = await Promise.all(
      categories.map(async (cat) => {
        // Count placement questions by category name
        const placementCount = await PlacementQuestion.countDocuments({ category: cat.name });
        // Quiz questions — same model for now (future: separate Quiz model)
        const quizCount = 0; // extend when quiz model exists

        return {
          _id: cat._id,
          name: cat.name,
          status: cat.status,
          ageGroups: cat.ageGroups || [],
          placementCount,
          quizCount,
          totalCount: placementCount + quizCount,
          createdAt: cat.createdAt,
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// POST /api/categories
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, status, ageGroups } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ message: 'Category name is required' });
      return;
    }
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      res.status(409).json({ message: 'A category with this name already exists' });
      return;
    }
    const category = new Category({
      name: name.trim(),
      status: status || 'pending',
      ageGroups: Array.isArray(ageGroups) ? ageGroups : [],
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({ message: 'Failed to create category' });
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, status, ageGroups } = req.body;
    const updates: { name?: string; status?: string; ageGroups?: string[] } = {};
    if (name) updates.name = name.trim();
    if (status) updates.status = status;
    if (Array.isArray(ageGroups)) updates.ageGroups = ageGroups;
    const category = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).json({ message: 'Failed to update category' });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
};
