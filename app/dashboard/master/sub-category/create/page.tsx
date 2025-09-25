'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { subCategories } from '@/lib/data';
import { ArrowLeft } from 'lucide-react';

interface SubCategory {
  id: number;
  subCatCode: string;
  subCatName: string;
}

function SubCategoryFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [formData, setFormData] = useState({
    subCatCode: '',
    subCatName: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Find the subcategory to edit
  const subCategoryToEdit = id
    ? subCategories.find((sc) => sc.subCatCode === id)
    : null;

  const handleReset = useCallback(() => {
    setFormData({
      subCatCode: '',
      subCatName: ''
    });
    setIsEditing(false);

    if (isEditing) {
      router.push('/dashboard/master/sub-category/create');
    }
  }, [isEditing, router]);

  useEffect(() => {
    if (subCategoryToEdit) {
      setFormData({
        subCatCode: subCategoryToEdit.subCatCode,
        subCatName: subCategoryToEdit.subCatName
      });
      setIsEditing(true);
    } else {
      handleReset();
    }
  }, [subCategoryToEdit, handleReset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      console.log('Updating subcategory:', formData);
      alert(`SubCategory ${formData.subCatCode} updated successfully!`);
    } else {
      console.log('Creating subcategory:', formData);
      alert(`SubCategory ${formData.subCatCode} created successfully!`);
    }

    router.push('/dashboard/master/sub-category');
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='flex items-center justify-between'>
          <div className='text-lg font-semibold'>
            {isEditing ? 'Edit Sub Category' : 'Create Sub Category'}
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => router.back()}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className='grid grid-cols-1 md:grid-cols-2 gap-6'
          >
            <div className='space-y-2'>
              <Label htmlFor='subCatCode'>Sub Category Code</Label>
              <Input
                id='subCatCode'
                placeholder='e.g., SC0001'
                value={formData.subCatCode}
                onChange={handleChange}
                required
                disabled={isEditing}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='subCatName'>Sub Category Name</Label>
              <Input
                id='subCatName'
                placeholder='E.g., Fiction'
                value={formData.subCatName}
                onChange={handleChange}
                required
              />
            </div>
            <div className='md:col-span-2 flex gap-3 justify-end pt-4 border-t'>
              <Button type='button' variant='outline' onClick={handleReset}>
                Clear
              </Button>
              <Button type='submit'>{isEditing ? 'Update' : 'Submit'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubCategoryForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubCategoryFormContent />
    </Suspense>
  );
}
