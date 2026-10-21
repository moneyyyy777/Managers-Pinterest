import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCustomPromptsFilePath } from '@/lib/paths';

function readCustomPrompts() {
  const filePath = getCustomPromptsFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      if (content) {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
      }
    }
  } catch (err) {
    console.error('Error reading custom prompts file:', err);
  }
  return [];
}

function writeCustomPrompts(prompts) {
  const filePath = getCustomPromptsFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(prompts, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const prompts = readCustomPrompts();
    return NextResponse.json({
      success: true,
      count: prompts.length,
      prompts
    });
  } catch (error) {
    console.error('Failed to get custom prompts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      category = 'Пользовательский',
      step = 1,
      purpose = '',
      whyNeeded = '',
      whenToUse = '',
      template = ''
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Укажите название промпта' },
        { status: 400 }
      );
    }

    if (!template || !template.trim()) {
      return NextResponse.json(
        { success: false, error: 'Укажите текст шаблона промпта' },
        { status: 400 }
      );
    }

    const prompts = readCustomPrompts();
    const now = new Date().toISOString();

    let targetPrompt = null;
    const existingIndex = id ? prompts.findIndex((p) => p.id === id) : -1;

    if (existingIndex >= 0) {
      targetPrompt = {
        ...prompts[existingIndex],
        title: title.trim(),
        category: category.trim(),
        step: Number(step) || 1,
        purpose: purpose.trim(),
        whyNeeded: whyNeeded.trim(),
        whenToUse: whenToUse.trim(),
        template: template.trim(),
        manualCopyPrompt: template.trim(),
        updatedAt: now
      };
      prompts[existingIndex] = targetPrompt;
    } else {
      const generatedId = id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      targetPrompt = {
        id: generatedId,
        title: title.trim(),
        category: category.trim(),
        step: Number(step) || 1,
        purpose: purpose.trim(),
        whyNeeded: whyNeeded.trim(),
        whenToUse: whenToUse.trim(),
        template: template.trim(),
        manualCopyPrompt: template.trim(),
        isCustom: true,
        createdAt: now,
        updatedAt: now
      };
      prompts.push(targetPrompt);
    }

    writeCustomPrompts(prompts);

    return NextResponse.json({
      success: true,
      prompt: targetPrompt,
      message: 'Промпт успешно сохранен'
    });
  } catch (error) {
    console.error('Failed to save custom prompt:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Параметр id обязателен' },
        { status: 400 }
      );
    }

    const prompts = readCustomPrompts();
    const filtered = prompts.filter((p) => p.id !== id);

    if (filtered.length === prompts.length) {
      return NextResponse.json(
        { success: false, error: 'Промпт с указанным id не найден' },
        { status: 404 }
      );
    }

    writeCustomPrompts(filtered);

    return NextResponse.json({
      success: true,
      id,
      message: 'Промпт успешно удален'
    });
  } catch (error) {
    console.error('Failed to delete custom prompt:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
