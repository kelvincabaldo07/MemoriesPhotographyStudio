"use client";

import { Card } from "@/components/ui/card";
import { RevenueLineChart } from "@/components/ui/revenue-line-chart";
import { testData } from "@/components/ui/revenue-line-chart.test";

/**
 * Chart Test & Demo Page
 * 
 * This page demonstrates all the features and edge cases of the RevenueLineChart component.
 * Access this page at: /admin/chart-test
 * 
 * Use this page to:
 * - Verify tooltip functionality by hovering over data points
 * - Test responsive behavior by resizing the browser
 * - Check dark mode compatibility
 * - Validate edge cases (zero data, volatile data, etc.)
 */
export default function ChartTestPage() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary">Revenue Chart Tests</h1>
        <p className="text-muted-foreground mt-2">
          Interactive demos and tests for the RevenueLineChart component.
          Hover over data points to see tooltips.
        </p>
      </div>

      <section>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            ✅ Standard Data (Typical Business Revenue)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            12 months of realistic revenue data with normal variance
          </p>
          <RevenueLineChart data={testData.standard} height={300} />
        </Card>
      </section>

      <section>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            📈 Steady Growth Pattern
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tests rendering with consistent upward trend
          </p>
          <RevenueLineChart data={testData.steadyGrowth} height={300} />
        </Card>
      </section>

      <section>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            ⚠️ Volatile Data (High Variance)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tests chart behavior with extreme ups and downs
          </p>
          <RevenueLineChart data={testData.volatile} height={300} />
        </Card>
      </section>

      <section>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            🟰 All Zero Revenue
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Edge case: No revenue in any month
          </p>
          <RevenueLineChart data={testData.allZero} height={300} />
        </Card>
      </section>

      <section>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            ❌ Empty Data
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Edge case: No data available (should show fallback message)
          </p>
          <RevenueLineChart data={testData.empty} height={300} />
        </Card>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <Card className="p-6">
            <h2 className="text-xl font-bold text-primary mb-4">
              🎨 Custom Color (Purple)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Tests custom stroke and fill colors
            </p>
            <RevenueLineChart 
              data={testData.standard} 
              strokeColor="#8b5cf6" 
              fillColor="#8b5cf6"
              height={250}
            />
          </Card>
        </section>

        <section>
          <Card className="p-6">
            <h2 className="text-xl font-bold text-primary mb-4">
              🔴 Custom Color (Red)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Alternative color scheme
            </p>
            <RevenueLineChart 
              data={testData.standard} 
              strokeColor="#ef4444" 
              fillColor="#ef4444"
              height={250}
            />
          </Card>
        </section>
      </div>

      <section>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            📊 Without Grid Lines
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Cleaner look with grid disabled
          </p>
          <RevenueLineChart 
            data={testData.standard} 
            showGrid={false}
            height={300}
          />
        </Card>
      </section>

      <section>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            📏 Compact Height (200px)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tests chart rendering at smaller heights
          </p>
          <RevenueLineChart 
            data={testData.standard} 
            height={200}
          />
        </Card>
      </section>

      <section className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Manual Testing Checklist</h2>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Interactive Features:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Hover over data points to see tooltips</li>
            <li>Verify tooltip shows correct revenue amount with ₱ symbol</li>
            <li>Check that tooltip shows full date (e.g., "Jan 2025")</li>
            <li>Confirm active dot enlarges on hover</li>
            <li>Verify cursor line appears when hovering</li>
          </ul>
          
          <p className="font-semibold mt-4">Visual Verification:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Gradient fill is visible and smooth</li>
            <li>Line connects all data points smoothly</li>
            <li>Grid lines are evenly spaced (when enabled)</li>
            <li>Axis labels are readable and properly formatted</li>
            <li>Y-axis shows abbreviated values (e.g., "50k")</li>
          </ul>

          <p className="font-semibold mt-4">Responsive Testing:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Resize browser window to test responsive behavior</li>
            <li>Test on mobile viewport (use DevTools)</li>
            <li>Verify chart adapts to container width</li>
          </ul>

          <p className="font-semibold mt-4">Dark Mode Testing:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Toggle dark mode in your system/browser</li>
            <li>Verify text is readable in both modes</li>
            <li>Check grid lines have appropriate opacity</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
